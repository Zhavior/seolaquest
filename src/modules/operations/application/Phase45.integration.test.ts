import { randomUUID } from 'node:crypto'
import type { ClaimedDurableJob } from '@/src/modules/core/jobs/DurableJobRepository'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import prisma from '@/lib/prisma'
import { DurableJobRepository } from '@/src/modules/core/jobs/DurableJobRepository'
import { AccountDeletionService } from '@/src/modules/lifecycle/application/AccountDeletionService'
import { AccountDeletionWorker } from '@/src/modules/lifecycle/application/AccountDeletionWorker'
import { deletionSubjectDigest } from '@/src/modules/lifecycle/domain/accountDeletion'
import { CrmDeliveryService } from '@/src/modules/leads/application/CrmDeliveryService'
import { ScanRunService } from '@/src/modules/leads/application/ScanRunService'

const integrationEnabled = process.env.PHASE45_INTEGRATION_TEST === 'true'
const runId = randomUUID()
const trackedUserIds = new Set<string>()
const trackedDeletionDigests = new Set<string>()
const trackedClerkEventIds = new Set<string>()

function userId(label: string) {
  const id = `phase45-${label}-${runId}`
  trackedUserIds.add(id)
  return id
}

async function createUser(id: string, overrides: { credits?: number; crmWebhookUrl?: string } = {}) {
  return prisma.user.create({
    data: {
      id,
      email: `${id}@integration.test`,
      name: 'Phase 4-5 Integration Fixture',
      questsRemaining: overrides.credits ?? 0,
      maxCredits: overrides.credits ?? 0,
      crmWebhookUrl: overrides.crmWebhookUrl,
    },
  })
}

async function createEntitledScanner(id: string, credits: number) {
  await createUser(id, { credits })
  await prisma.trackedKeyword.create({
    data: { userId: id, phrase: `durable scan ${id}` },
  })
  await prisma.billingSubscription.create({
    data: {
      userId: id,
      stripeCustomerId: `cus_${id}`,
      stripeSubscriptionId: `sub_${id}`,
      plan: 'BETA',
      status: 'active',
      currentPeriodEnd: new Date('2099-01-01T00:00:00.000Z'),
    },
  })
}

async function createScanJob(input: {
  id: string
  userId: string
  nextAttemptAt?: Date
  status?: string
  attempts?: number
  maxAttempts?: number
  leaseOwner?: string
  leaseGeneration?: number
  leaseExpiresAt?: Date
}) {
  const run = await prisma.scanRun.create({
    data: {
      id: `run-${input.id}`,
      userId: input.userId,
      trigger: 'MANUAL',
      windowStartedAt: new Date(),
    },
  })
  return prisma.durableJob.create({
    data: {
      id: input.id,
      userId: input.userId,
      kind: 'TENANT_SCAN',
      dedupeKey: `scan:${run.id}`,
      scanRunId: run.id,
      nextAttemptAt: input.nextAttemptAt,
      status: input.status,
      attempts: input.attempts,
      maxAttempts: input.maxAttempts,
      leaseOwner: input.leaseOwner,
      leaseGeneration: input.leaseGeneration,
      leaseExpiresAt: input.leaseExpiresAt,
    },
  })
}

describe.skipIf(!integrationEnabled)('Phases 4-5 real PostgreSQL invariants', () => {
  beforeAll(async () => {
    const [clock] = await prisma.$queryRaw<Array<{ timezone: string }>>`
      SELECT current_setting('TimeZone') AS "timezone"
    `
    expect(clock?.timezone).toBe('UTC')
  })

  afterAll(async () => {
    vi.unstubAllEnvs()
    await prisma.accountDeletionAudit.deleteMany({
      where: { subjectDigest: { in: [...trackedDeletionDigests] } },
    })
    await prisma.user.deleteMany({ where: { id: { in: [...trackedUserIds] } } })
    await prisma.accountDeletionRequest.deleteMany({
      where: { subjectDigest: { in: [...trackedDeletionDigests] } },
    })
    await prisma.clerkWebhookEvent.deleteMany({
      where: { eventId: { in: [...trackedClerkEventIds] } },
    })
    await prisma.$disconnect()
  })

  it('serializes concurrent scan acceptance and terminally refunds exactly once', async () => {
    const id = userId('scan')
    await createEntitledScanner(id, 1)

    const accepted = await Promise.all([
      ScanRunService.enqueueManual(id),
      ScanRunService.enqueueManual(id),
    ])

    expect(accepted).toEqual(expect.arrayContaining([
      expect.objectContaining({ queued: true, existing: false }),
      expect.objectContaining({ queued: false, existing: true }),
    ]))
    const runs = await prisma.scanRun.findMany({ where: { userId: id } })
    expect(runs).toHaveLength(1)
    await expect(prisma.creditLedgerEntry.count({
      where: { userId: id, sourceType: 'SCAN_RUN_DEBIT' },
    })).resolves.toBe(1)
    await expect(prisma.durableJob.count({
      where: { userId: id, kind: 'TENANT_SCAN' },
    })).resolves.toBe(1)
    await expect(prisma.user.findUniqueOrThrow({
      where: { id },
      select: { questsRemaining: true },
    })).resolves.toEqual({ questsRemaining: 0 })

    const claimed = await prisma.durableJob.update({
      where: { scanRunId: runs[0].id },
      data: {
        status: 'RUNNING',
        attempts: 5,
        maxAttempts: 5,
        leaseOwner: 'terminal-refund-worker',
        leaseGeneration: { increment: 1 },
        leaseExpiresAt: new Date(Date.now() + 60_000),
      },
    }) as ClaimedDurableJob

    await expect(ScanRunService.handleClaimedJobFailure(
      claimed,
      Object.assign(new Error('provider unavailable'), { code: 'PROVIDER_UNAVAILABLE' }),
    )).resolves.toBe(true)
    await expect(ScanRunService.handleClaimedJobFailure(
      claimed,
      Object.assign(new Error('replayed failure'), { code: 'PROVIDER_UNAVAILABLE' }),
    )).resolves.toBe(false)

    await expect(prisma.creditLedgerEntry.count({
      where: { userId: id, sourceType: 'SCAN_RUN_REFUND', sourceId: runs[0].id },
    })).resolves.toBe(1)
    await expect(prisma.user.findUniqueOrThrow({
      where: { id },
      select: { questsRemaining: true },
    })).resolves.toEqual({ questsRemaining: 1 })
    await expect(prisma.scanRun.findUniqueOrThrow({
      where: { id: runs[0].id },
      select: { status: true },
    })).resolves.toEqual({ status: 'FAILED_REFUNDED' })

    await prisma.user.delete({ where: { id } })
    trackedUserIds.delete(id)
  })

  it('claims disjoint tenants concurrently, reclaims an expired lease, and fences the old owner', async () => {
    const tenantA = userId('claim-a')
    const tenantB = userId('claim-b')
    const tenantC = userId('claim-expired')
    await Promise.all([createUser(tenantA), createUser(tenantB), createUser(tenantC)])
    const readyAt = new Date(Date.now() - 60_000)
    const [jobA1, jobA2, jobB] = await Promise.all([
      createScanJob({ id: `job-a1-${runId}`, userId: tenantA, nextAttemptAt: readyAt }),
      createScanJob({ id: `job-a2-${runId}`, userId: tenantA, nextAttemptAt: readyAt }),
      createScanJob({ id: `job-b-${runId}`, userId: tenantB, nextAttemptAt: readyAt }),
    ])

    const concurrentClaims = await Promise.all([
      DurableJobRepository.claimBatch({ workerId: 'worker-a', batchSize: 1 }),
      DurableJobRepository.claimBatch({ workerId: 'worker-b', batchSize: 1 }),
    ])
    const claimed = concurrentClaims.flat()
    expect(claimed).toHaveLength(2)
    expect(new Set(claimed.map((job) => job.id)).size).toBe(2)
    expect(new Set(claimed.map((job) => job.userId))).toEqual(new Set([tenantA, tenantB]))
    await Promise.all(claimed.map((job) => DurableJobRepository.markSucceeded(job)))
    await prisma.durableJob.updateMany({
      where: { id: { in: [jobA1.id, jobA2.id, jobB.id] }, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    })

    const expired = await createScanJob({
      id: `job-expired-${runId}`,
      userId: tenantC,
      nextAttemptAt: readyAt,
      status: 'RUNNING',
      attempts: 1,
      leaseOwner: 'old-worker',
      leaseGeneration: 3,
      leaseExpiresAt: new Date(Date.now() - 60_000),
    })
    const [reclaimed] = await DurableJobRepository.claimBatch({
      workerId: 'replacement-worker',
      batchSize: 1,
    })
    expect(reclaimed).toMatchObject({
      id: expired.id,
      leaseOwner: 'replacement-worker',
      leaseGeneration: 4,
      attempts: 2,
    })
    await expect(DurableJobRepository.markSucceeded({
      id: expired.id,
      leaseOwner: 'old-worker',
      leaseGeneration: 3,
    })).resolves.toBe(false)
    await expect(DurableJobRepository.markSucceeded(reclaimed)).resolves.toBe(true)
    await expect(prisma.durableJob.findUniqueOrThrow({
      where: { id: expired.id },
      select: { status: true, leaseOwner: true },
    })).resolves.toEqual({ status: 'SUCCEEDED', leaseOwner: null })

    await prisma.user.deleteMany({ where: { id: { in: [tenantA, tenantB, tenantC] } } })
    trackedUserIds.delete(tenantA)
    trackedUserIds.delete(tenantB)
    trackedUserIds.delete(tenantC)
  })

  it('dead-letters an expired max-attempt CRM lease and claims the next tenant job', async () => {
    const id = userId('claim-exhausted')
    await createUser(id, { crmWebhookUrl: 'https://hooks.example.test/exhausted' })
    const keyword = await prisma.trackedKeyword.create({
      data: { userId: id, phrase: `exhausted crm ${runId}` },
    })
    const [exhaustedLead, nextLead] = await Promise.all([
      prisma.lead.create({
        data: {
          userId: id,
          keywordId: keyword.id,
          platform: 'REDDIT',
          externalPostId: `exhausted-${runId}`,
          author: 'exhausted-author',
          content: 'Exhausted delivery fixture',
          matched: keyword.phrase,
          url: 'https://www.reddit.com/r/saas/exhausted',
        },
      }),
      prisma.lead.create({
        data: {
          userId: id,
          keywordId: keyword.id,
          platform: 'REDDIT',
          externalPostId: `next-${runId}`,
          author: 'next-author',
          content: 'Next delivery fixture',
          matched: keyword.phrase,
          url: 'https://www.reddit.com/r/saas/next',
        },
      }),
    ])
    const [exhaustedDelivery, nextDelivery] = await Promise.all([
      prisma.crmExportDelivery.create({
        data: {
          userId: id,
          leadId: exhaustedLead.id,
          payload: { id: exhaustedLead.id },
          destinationFingerprint: 'b'.repeat(64),
        },
      }),
      prisma.crmExportDelivery.create({
        data: {
          userId: id,
          leadId: nextLead.id,
          payload: { id: nextLead.id },
          destinationFingerprint: 'c'.repeat(64),
        },
      }),
    ])
    const readyAt = new Date(Date.now() - 120_000)
    const expiredLeaseAt = new Date(Date.now() - 60_000)
    const [exhaustedJob, nextJob] = await Promise.all([
      prisma.durableJob.create({
        data: {
          id: `job-exhausted-${runId}`,
          userId: id,
          kind: 'CRM_EXPORT',
          status: 'RUNNING',
          dedupeKey: `crm:${exhaustedDelivery.id}`,
          crmDeliveryId: exhaustedDelivery.id,
          attempts: 5,
          maxAttempts: 5,
          nextAttemptAt: readyAt,
          leaseOwner: 'crashed-final-worker',
          leaseGeneration: 5,
          leaseExpiresAt: expiredLeaseAt,
        },
      }),
      prisma.durableJob.create({
        data: {
          id: `job-after-exhausted-${runId}`,
          userId: id,
          kind: 'CRM_EXPORT',
          dedupeKey: `crm:${nextDelivery.id}`,
          crmDeliveryId: nextDelivery.id,
          nextAttemptAt: new Date(readyAt.getTime() + 1_000),
        },
      }),
    ])

    const [claimed] = await DurableJobRepository.claimBatch({
      workerId: 'after-exhausted-worker',
      batchSize: 1,
    })

    expect(claimed).toMatchObject({
      id: nextJob.id,
      userId: id,
      status: 'RUNNING',
      attempts: 1,
      leaseOwner: 'after-exhausted-worker',
    })
    await expect(prisma.durableJob.findUniqueOrThrow({
      where: { id: exhaustedJob.id },
      select: {
        status: true,
        attempts: true,
        leaseOwner: true,
        leaseExpiresAt: true,
        lastErrorCode: true,
        deadAt: true,
      },
    })).resolves.toMatchObject({
      status: 'DEAD',
      attempts: 5,
      leaseOwner: null,
      leaseExpiresAt: null,
      lastErrorCode: 'LEASE_EXPIRED_AT_MAX_ATTEMPTS',
      deadAt: expect.any(Date),
    })
    await expect(prisma.crmExportDelivery.findUniqueOrThrow({
      where: { id: exhaustedDelivery.id },
      select: { status: true, lastErrorCode: true },
    })).resolves.toEqual({
      status: 'DEAD',
      lastErrorCode: 'LEASE_EXPIRED_AT_MAX_ATTEMPTS',
    })
    await expect(prisma.crmExportDelivery.findUniqueOrThrow({
      where: { id: nextDelivery.id },
      select: { status: true },
    })).resolves.toEqual({ status: 'QUEUED' })

    await prisma.user.delete({ where: { id } })
    trackedUserIds.delete(id)
  })

  it('atomically requeues one existing dead CRM job under concurrent retry requests', async () => {
    const id = userId('crm-retry')
    const destination = 'https://hooks.example.test/retry'
    await createUser(id, { crmWebhookUrl: destination })
    const keyword = await prisma.trackedKeyword.create({
      data: { userId: id, phrase: `crm retry ${runId}` },
    })
    const lead = await prisma.lead.create({
      data: {
        userId: id,
        keywordId: keyword.id,
        platform: 'REDDIT',
        externalPostId: `crm-retry-${runId}`,
        author: 'crm-retry-author',
        content: 'CRM retry fixture',
        matched: keyword.phrase,
        url: 'https://www.reddit.com/r/saas/crm-retry',
      },
    })
    const enqueued = await CrmDeliveryService.enqueue({
      userId: id,
      leadId: lead.id,
      normalizedDestination: destination,
    })
    if (!enqueued.ok) throw new Error(`CRM enqueue failed: ${enqueued.reason}`)

    await prisma.crmExportDelivery.update({
      where: { id: enqueued.deliveryId },
      data: {
        status: 'DEAD',
        responseStatus: 503,
        lastErrorCode: 'CRM_HTTP_503',
      },
    })
    await prisma.durableJob.update({
      where: { crmDeliveryId: enqueued.deliveryId },
      data: {
        status: 'DEAD',
        attempts: 5,
        maxAttempts: 5,
        lastErrorCode: 'CRM_HTTP_503',
        deadAt: new Date(),
      },
    })

    const retries = await Promise.all([
      CrmDeliveryService.retryDead({
        userId: id,
        deliveryId: enqueued.deliveryId,
        normalizedDestination: destination,
      }),
      CrmDeliveryService.retryDead({
        userId: id,
        deliveryId: enqueued.deliveryId,
        normalizedDestination: destination,
      }),
    ])

    expect(retries).toEqual(expect.arrayContaining([
      { ok: true, deliveryId: enqueued.deliveryId, status: 'QUEUED' },
      { ok: false, reason: 'NOT_RETRYABLE' },
    ]))
    await expect(prisma.crmExportDelivery.findUniqueOrThrow({
      where: { id: enqueued.deliveryId },
      select: { status: true, responseStatus: true, lastErrorCode: true },
    })).resolves.toEqual({ status: 'QUEUED', responseStatus: null, lastErrorCode: null })
    await expect(prisma.durableJob.findMany({
      where: { crmDeliveryId: enqueued.deliveryId },
      select: {
        status: true,
        attempts: true,
        leaseOwner: true,
        leaseExpiresAt: true,
        lastErrorCode: true,
        deadAt: true,
      },
    })).resolves.toEqual([{
      status: 'PENDING',
      attempts: 0,
      leaseOwner: null,
      leaseExpiresAt: null,
      lastErrorCode: null,
      deadAt: null,
    }])

    await prisma.user.delete({ where: { id } })
    trackedUserIds.delete(id)
  })

  it('atomically snapshots one CRM delivery and deduplicates simultaneous enqueue without a network call', async () => {
    const id = userId('crm')
    await createUser(id, { crmWebhookUrl: 'https://hooks.example.test/coquest' })
    const keyword = await prisma.trackedKeyword.create({
      data: { userId: id, phrase: 'looking for crm' },
    })
    const lead = await prisma.lead.create({
      data: {
        userId: id,
        keywordId: keyword.id,
        platform: 'REDDIT',
        externalPostId: `external-${runId}`,
        author: 'integration-author',
        content: 'Need a CRM this week',
        matched: keyword.phrase,
        url: 'https://www.reddit.com/r/saas/integration',
      },
    })
    const input = {
      userId: id,
      leadId: lead.id,
      normalizedDestination: 'https://hooks.example.test/coquest',
    }

    const [first, replay] = await Promise.all([
      CrmDeliveryService.enqueue(input),
      CrmDeliveryService.enqueue(input),
    ])

    expect([first, replay]).toEqual(expect.arrayContaining([
      expect.objectContaining({ ok: true, queued: true, existing: false }),
      expect.objectContaining({ ok: true, queued: true, existing: true }),
    ]))
    expect(first.ok && replay.ok).toBe(true)
    if (!first.ok || !replay.ok) throw new Error('CRM enqueue failed')
    expect(first.deliveryId).toBe(replay.deliveryId)
    await expect(prisma.crmExportDelivery.count({ where: { userId: id } })).resolves.toBe(1)
    await expect(prisma.durableJob.count({
      where: { userId: id, kind: 'CRM_EXPORT' },
    })).resolves.toBe(1)

    await prisma.user.delete({ where: { id } })
    trackedUserIds.delete(id)
  })

  it('replays Clerk deletion safely, purges tenant data, and retains only digest tombstones', async () => {
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'true')
    vi.stubEnv('DELETION_AUDIT_SECRET', `phase45-audit-secret-${runId}`)
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_clerk')
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'whsec_clerk')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_stripe')
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    const id = userId('delete')
    const eventId = `clerk-event-${runId}`
    trackedClerkEventIds.add(eventId)
    const subjectDigest = deletionSubjectDigest(id)
    trackedDeletionDigests.add(subjectDigest)
    const customerId = `cus_delete_${runId}`
    const subscriptionId = `sub_delete_${runId}`
    const email = `${id}@sensitive.integration.test`
    const sensitiveName = `Sensitive Name ${runId}`
    const sensitiveWebhook = 'https://sensitive.example.test/private-hook'
    await prisma.user.create({
      data: {
        id,
        email,
        name: sensitiveName,
        crmWebhookUrl: sensitiveWebhook,
        questsRemaining: 2,
        maxCredits: 2,
      },
    })
    const keyword = await prisma.trackedKeyword.create({
      data: { userId: id, phrase: `sensitive keyword ${runId}` },
    })
    const lead = await prisma.lead.create({
      data: {
        userId: id,
        keywordId: keyword.id,
        platform: 'REDDIT',
        externalPostId: `delete-external-${runId}`,
        author: `sensitive-author-${runId}`,
        content: `sensitive lead ${runId}`,
        matched: keyword.phrase,
        url: `https://sensitive.example.test/${runId}`,
      },
    })
    await Promise.all([
      prisma.post.create({ data: { userId: id, content: `sensitive post ${runId}` } }),
      prisma.checkoutIntent.create({
        data: { userId: id, kind: 'POTION', sku: 'minor_vial' },
      }),
      prisma.creditLedgerEntry.create({
        data: {
          userId: id,
          delta: 2,
          reason: 'INTEGRATION_FIXTURE',
          sourceType: 'INTEGRATION_FIXTURE',
          sourceId: `ledger-${runId}`,
        },
      }),
      prisma.billingSubscription.create({
        data: {
          userId: id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          plan: 'BETA',
          status: 'active',
          currentPeriodEnd: new Date('2099-01-01T00:00:00.000Z'),
        },
      }),
    ])
    const delivery = await prisma.crmExportDelivery.create({
      data: {
        userId: id,
        leadId: lead.id,
        payload: { content: `sensitive payload ${runId}` },
        destinationFingerprint: 'a'.repeat(64),
      },
    })
    await prisma.durableJob.create({
      data: {
        userId: id,
        kind: 'CRM_EXPORT',
        dedupeKey: `delete-crm-${runId}`,
        crmDeliveryId: delivery.id,
      },
    })

    await expect(AccountDeletionService.acceptClerkUserDeleted({
      eventId,
      eventType: 'user.deleted',
      clerkUserId: id,
    })).resolves.toEqual({ duplicate: false })
    const stripeDelete = vi.fn().mockResolvedValue({ deleted: true })
    await expect(AccountDeletionWorker.processBatch({
      stripe: { customers: { del: stripeDelete } } as never,
      now: new Date(),
      leaseToken: `deletion-worker-${runId}`,
    })).resolves.toEqual({
      claimed: 1,
      completed: 1,
      retried: 0,
      dead: 0,
      leaseLost: 0,
    })
    await expect(AccountDeletionService.acceptClerkUserDeleted({
      eventId,
      eventType: 'user.deleted',
      clerkUserId: id,
    })).resolves.toEqual({ duplicate: true })

    expect(stripeDelete).toHaveBeenCalledExactlyOnceWith(customerId)
    await expect(prisma.user.findUnique({ where: { id } })).resolves.toBeNull()
    const request = await prisma.accountDeletionRequest.findUniqueOrThrow({
      where: { subjectDigest },
    })
    expect(request).toMatchObject({
      userId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      status: 'COMPLETED',
    })
    const audit = await prisma.accountDeletionAudit.findUniqueOrThrow({
      where: { subjectDigest },
    })
    expect(audit).toMatchObject({
      resultCode: 'PURGED',
      userRowsDeleted: 1,
      keywordRowsDeleted: 1,
      leadRowsDeleted: 1,
      postRowsDeleted: 1,
      checkoutRowsDeleted: 1,
      ledgerRowsDeleted: 1,
      billingRowsDeleted: 1,
      durableJobRowsDeleted: 1,
      crmDeliveryRowsDeleted: 1,
    })
    expect(audit.subjectDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(audit.stripeCustomerDigest).toMatch(/^[a-f0-9]{64}$/)
    const tombstone = JSON.stringify({ request, audit })
    for (const rawIdentifier of [
      id,
      email,
      sensitiveName,
      sensitiveWebhook,
      customerId,
      subscriptionId,
    ]) {
      expect(tombstone).not.toContain(rawIdentifier)
    }

    trackedUserIds.delete(id)
  })
})
