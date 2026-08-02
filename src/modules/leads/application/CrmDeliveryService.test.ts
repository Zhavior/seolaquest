import type { ClaimedDurableJob } from '@/src/modules/core/jobs/DurableJobRepository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  leadFindFirst: vi.fn(),
  deliveryCreate: vi.fn(),
  deliveryFindFirst: vi.fn(),
  deliveryUpdateMany: vi.fn(),
  jobCreate: vi.fn(),
  queryRaw: vi.fn(),
  leadUpdateMany: vi.fn(),
  userUpdate: vi.fn(),
  postCrmWebhook: vi.fn(),
  markSucceeded: vi.fn(),
  scheduleRetry: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/src/modules/core/jobs/DurableJobRepository', () => ({
  DurableJobRepository: {
    markSucceeded: mocks.markSucceeded,
    scheduleRetry: mocks.scheduleRetry,
  },
}))
vi.mock('@/src/modules/core/security/crmWebhookRequest', () => ({
  postCrmWebhook: mocks.postCrmWebhook,
}))

const tx = {
  lead: { findFirst: mocks.leadFindFirst, updateMany: mocks.leadUpdateMany },
  crmExportDelivery: {
    create: mocks.deliveryCreate,
    findFirst: mocks.deliveryFindFirst,
    updateMany: mocks.deliveryUpdateMany,
  },
  durableJob: { create: mocks.jobCreate },
  user: { update: mocks.userUpdate },
  $queryRaw: mocks.queryRaw,
}

vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: mocks.transaction,
    crmExportDelivery: {
      findFirst: mocks.deliveryFindFirst,
      updateMany: mocks.deliveryUpdateMany,
    },
  },
}))

import { CrmDeliveryService, destinationFingerprint } from './CrmDeliveryService'

function claimedJob(attempts = 1) {
  return {
    id: 'job-1',
    userId: 'user-1',
    crmDeliveryId: 'delivery-1',
    attempts,
    maxAttempts: 5,
    leaseOwner: 'worker-1',
    leaseGeneration: 2,
  } as unknown as ClaimedDurableJob
}

describe('CrmDeliveryService durable contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx))
    mocks.queryRaw.mockResolvedValue([{ id: 'lead-1' }])
    mocks.leadFindFirst.mockResolvedValue({
      id: 'lead-1',
      userId: 'user-1',
      platform: 'REDDIT',
      author: 'u/hunter',
      content: 'Need a CRM',
      url: 'https://reddit.com/r/saas/lead-1',
      status: 'NEW',
      createdAt: new Date('2026-07-30T12:00:00.000Z'),
      crmExportedAt: null,
      keyword: { phrase: 'need a CRM' },
      crmDelivery: null,
    })
    mocks.deliveryCreate.mockResolvedValue({ id: 'delivery-1' })
    mocks.jobCreate.mockResolvedValue({ id: 'job-1' })
  })

  it('queues an immutable payload snapshot and destination fingerprint atomically', async () => {
    await expect(CrmDeliveryService.enqueue({
      userId: 'user-1',
      leadId: 'lead-1',
      normalizedDestination: 'https://hooks.example.com/crm',
    })).resolves.toMatchObject({ ok: true, queued: true, deliveryId: 'delivery-1' })

    expect(mocks.deliveryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        leadId: 'lead-1',
        destinationFingerprint: destinationFingerprint('https://hooks.example.com/crm'),
        payload: expect.objectContaining({
          id: 'lead-1',
          keyword: 'need a CRM',
          createdAt: '2026-07-30T12:00:00.000Z',
        }),
      }),
    })
    expect(mocks.jobCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ kind: 'CRM_EXPORT', crmDeliveryId: 'delivery-1' }),
    })
    expect(mocks.queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.leadFindFirst.mock.invocationCallOrder[0],
    )
  })

  it('returns only tenant-scoped, sanitized delivery status', async () => {
    mocks.deliveryFindFirst.mockResolvedValue({
      id: 'delivery-1',
      leadId: 'lead-1',
      status: 'DEAD',
      responseStatus: 503,
      deliveredAt: null,
      createdAt: new Date('2026-07-30T12:00:00Z'),
      updatedAt: new Date('2026-07-30T12:05:00Z'),
      durableJob: { attempts: 5, maxAttempts: 5 },
    })

    await expect(CrmDeliveryService.getStatus({ userId: 'user-1', deliveryId: 'delivery-1' }))
      .resolves.toEqual({
        id: 'delivery-1',
        leadId: 'lead-1',
        status: 'DEAD',
        attempts: 5,
        maxAttempts: 5,
        responseStatusClass: '5xx',
        deliveredAt: null,
        createdAt: '2026-07-30T12:00:00.000Z',
        updatedAt: '2026-07-30T12:05:00.000Z',
      })
    expect(mocks.deliveryFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'delivery-1', userId: 'user-1' },
    }))
  })

  it('requeues a dead delivery only when tenant and destination still match', async () => {
    mocks.deliveryFindFirst.mockResolvedValue({
      id: 'delivery-1',
      userId: 'user-1',
      status: 'DEAD',
      destinationFingerprint: destinationFingerprint('https://hooks.example.com/crm'),
      durableJob: { id: 'job-1', status: 'DEAD' },
    })
    mocks.queryRaw.mockResolvedValueOnce([{ id: 'delivery-1' }]).mockResolvedValueOnce([{ id: 'job-1' }])
    mocks.deliveryUpdateMany.mockResolvedValue({ count: 1 })

    await expect(CrmDeliveryService.retryDead({
      userId: 'user-1',
      deliveryId: 'delivery-1',
      normalizedDestination: 'https://hooks.example.com/crm',
    })).resolves.toEqual({ ok: true, deliveryId: 'delivery-1', status: 'QUEUED' })
    const retrySql = Array.from(mocks.queryRaw.mock.calls[1][0] as TemplateStringsArray).join('?')
    expect(retrySql).toContain('"attempts" = 0')
    expect(retrySql).toContain('"status" = \'DEAD\'')
    expect(mocks.deliveryUpdateMany).toHaveBeenCalledWith({
      where: { id: 'delivery-1', userId: 'user-1', status: 'DEAD' },
      data: { status: 'QUEUED', responseStatus: null, lastErrorCode: null },
    })
  })

  it('does not retry against a changed CRM destination', async () => {
    mocks.deliveryFindFirst.mockResolvedValue({
      id: 'delivery-1',
      userId: 'user-1',
      status: 'DEAD',
      destinationFingerprint: destinationFingerprint('https://old.example.com/crm'),
      durableJob: { id: 'job-1', status: 'DEAD' },
    })

    await expect(CrmDeliveryService.retryDead({
      userId: 'user-1',
      deliveryId: 'delivery-1',
      normalizedDestination: 'https://new.example.com/crm',
    })).resolves.toEqual({ ok: false, reason: 'DESTINATION_CHANGED' })
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.deliveryUpdateMany).not.toHaveBeenCalled()
  })

  it('serializes simultaneous first acceptance into one delivery and one job', async () => {
    let currentDelivery: { id: string; status: string } | null = null
    let transactionQueue = Promise.resolve()
    mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => {
      const result = transactionQueue.then(() => callback(tx))
      transactionQueue = result.then(() => undefined, () => undefined)
      return result
    })
    mocks.leadFindFirst.mockImplementation(async () => ({
      id: 'lead-1',
      userId: 'user-1',
      platform: 'REDDIT',
      author: 'u/hunter',
      content: 'Need a CRM',
      url: 'https://reddit.com/r/saas/lead-1',
      status: 'NEW',
      createdAt: new Date('2026-07-30T12:00:00.000Z'),
      crmExportedAt: null,
      keyword: { phrase: 'need a CRM' },
      crmDelivery: currentDelivery,
    }))
    mocks.deliveryCreate.mockImplementation(async () => {
      currentDelivery = { id: 'delivery-1', status: 'QUEUED' }
      return currentDelivery
    })

    const input = {
      userId: 'user-1',
      leadId: 'lead-1',
      normalizedDestination: 'https://hooks.example.com/crm',
    }
    const results = await Promise.all([
      CrmDeliveryService.enqueue(input),
      CrmDeliveryService.enqueue(input),
    ])

    expect(results).toEqual([
      expect.objectContaining({ ok: true, existing: false, deliveryId: 'delivery-1' }),
      expect.objectContaining({ ok: true, existing: true, deliveryId: 'delivery-1' }),
    ])
    expect(mocks.deliveryCreate).toHaveBeenCalledTimes(1)
    expect(mocks.jobCreate).toHaveBeenCalledTimes(1)
    expect(mocks.queryRaw).toHaveBeenCalledTimes(2)
  })

  it('revalidates the destination and sends stable idempotency headers on every attempt', async () => {
    const payload = { id: 'lead-1', content: 'snapshot' }
    mocks.deliveryFindFirst.mockResolvedValue({
      id: 'delivery-1',
      userId: 'user-1',
      leadId: 'lead-1',
      status: 'QUEUED',
      payload,
      destinationFingerprint: destinationFingerprint('https://hooks.example.com/crm'),
      user: { crmWebhookUrl: 'https://hooks.example.com/crm' },
    })
    mocks.postCrmWebhook.mockResolvedValue({ ok: true, status: 204 })
    mocks.queryRaw.mockResolvedValue([{ id: 'job-1' }])
    mocks.deliveryUpdateMany.mockResolvedValue({ count: 1 })
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 })
    mocks.userUpdate.mockResolvedValue({ id: 'user-1' })

    await CrmDeliveryService.processClaimedJob(claimedJob())

    expect(mocks.postCrmWebhook).toHaveBeenCalledWith(
      'https://hooks.example.com/crm',
      payload,
      {
        idempotencyKey: 'coquest-crm-delivery-1',
        deliveryId: 'delivery-1',
      },
    )
    expect(mocks.deliveryUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'delivery-1', userId: 'user-1', status: 'QUEUED' },
    }))
    expect(mocks.userUpdate).toHaveBeenCalledTimes(1)
  })

  it('refuses to dispatch when the current destination no longer matches the snapshot', async () => {
    mocks.deliveryFindFirst.mockResolvedValue({
      id: 'delivery-1',
      userId: 'user-1',
      leadId: 'lead-1',
      status: 'QUEUED',
      payload: { id: 'lead-1' },
      destinationFingerprint: destinationFingerprint('https://old.example.com/crm'),
      user: { crmWebhookUrl: 'https://new.example.com/crm' },
    })

    await expect(CrmDeliveryService.processClaimedJob(claimedJob())).rejects.toMatchObject({
      code: 'CRM_DESTINATION_CHANGED',
    })
    expect(mocks.postCrmWebhook).not.toHaveBeenCalled()
  })

  it('schedules bounded retry state instead of claiming a failed delivery', async () => {
    mocks.scheduleRetry.mockResolvedValue(true)
    mocks.deliveryUpdateMany.mockResolvedValue({ count: 1 })
    const job = claimedJob(2)
    await CrmDeliveryService.handleClaimedJobFailure(
      job,
      Object.assign(new Error('temporary'), { code: 'CRM_HTTP_503' }),
    )
    expect(mocks.scheduleRetry).toHaveBeenCalledWith(job, 2, 'CRM_HTTP_503')
    expect(mocks.deliveryUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { lastErrorCode: 'CRM_HTTP_503' },
    }))
  })
})
