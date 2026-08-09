import 'server-only'

import { createHash, timingSafeEqual } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import {
  DurableJobRepository,
  type ClaimedDurableJob,
} from '@/src/modules/core/jobs/DurableJobRepository'
import { durableErrorCode, DurableJobError } from '@/src/modules/core/jobs/jobErrors'
import { EventFactory } from '@/src/modules/core/events/EventFactory'
import { EventStore } from '@/src/modules/core/events/EventStore'
import { postCrmWebhook } from '@/src/modules/core/security/crmWebhookRequest'
import { normalizeCrmWebhookUrl } from '@/src/modules/core/security/crmWebhookUrl'

export function destinationFingerprint(url: string) {
  return createHash('sha256').update(url, 'utf8').digest('hex')
}

function fingerprintsMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

class CrmHttpError extends DurableJobError {
  constructor(public readonly responseStatus: number) {
    super(`CRM_HTTP_${responseStatus}`, 'CRM webhook returned a non-success response')
  }
}

export class CrmDeliveryService {
  static async getStatus(input: { userId: string; deliveryId: string }) {
    const delivery = await prisma.crmExportDelivery.findFirst({
      where: { id: input.deliveryId, userId: input.userId },
      select: {
        id: true,
        leadId: true,
        status: true,
        responseStatus: true,
        deliveredAt: true,
        createdAt: true,
        updatedAt: true,
        durableJob: { select: { attempts: true, maxAttempts: true } },
      },
    })
    if (!delivery) return null

    return {
      id: delivery.id,
      leadId: delivery.leadId,
      status: delivery.status,
      attempts: delivery.durableJob?.attempts ?? 0,
      maxAttempts: delivery.durableJob?.maxAttempts ?? 0,
      responseStatusClass: delivery.responseStatus
        ? `${Math.floor(delivery.responseStatus / 100)}xx`
        : null,
      deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
      createdAt: delivery.createdAt.toISOString(),
      updatedAt: delivery.updatedAt.toISOString(),
    }
  }

  static async retryDead(input: { userId: string; deliveryId: string; normalizedDestination: string }) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT "id"
        FROM "CrmExportDelivery"
        WHERE "id" = ${input.deliveryId} AND "userId" = ${input.userId}
        FOR UPDATE
      `
      const delivery = await tx.crmExportDelivery.findFirst({
        where: { id: input.deliveryId, userId: input.userId },
        include: { durableJob: true },
      })
      if (!delivery) return { ok: false as const, reason: 'NOT_FOUND' as const }
      if (delivery.status !== 'DEAD' || delivery.durableJob?.status !== 'DEAD') {
        return { ok: false as const, reason: 'NOT_RETRYABLE' as const }
      }
      if (!fingerprintsMatch(
        delivery.destinationFingerprint,
        destinationFingerprint(input.normalizedDestination),
      )) {
        return { ok: false as const, reason: 'DESTINATION_CHANGED' as const }
      }

      const jobs = await tx.$queryRaw<Array<{ id: string }>>`
        UPDATE "DurableJob"
        SET
          "status" = 'PENDING',
          "attempts" = 0,
          "nextAttemptAt" = clock_timestamp(),
          "leaseOwner" = NULL,
          "leaseExpiresAt" = NULL,
          "lastErrorCode" = NULL,
          "deadAt" = NULL,
          "completedAt" = NULL,
          "updatedAt" = clock_timestamp()
        WHERE "id" = ${delivery.durableJob.id}
          AND "userId" = ${input.userId}
          AND "status" = 'DEAD'
        RETURNING "id"
      `
      if (jobs.length !== 1) return { ok: false as const, reason: 'NOT_RETRYABLE' as const }

      const reset = await tx.crmExportDelivery.updateMany({
        where: { id: delivery.id, userId: input.userId, status: 'DEAD' },
        data: { status: 'QUEUED', responseStatus: null, lastErrorCode: null },
      })
      // An assertion, not a ConflictError: the row is already pinned by the `FOR UPDATE`
      // above and was just observed as DEAD, so a zero-count reset is unreachable unless
      // the fence itself is broken. Throwing rolls the transaction back; a 409 would tell
      // the caller to retry a request that is not actually racing anyone.
      if (reset.count !== 1) throw new Error('CRM_DELIVERY_RETRY_FENCE_FAILED')
      return { ok: true as const, deliveryId: delivery.id, status: 'QUEUED' as const }
    })
  }

  static async enqueue(input: { userId: string; leadId: string; normalizedDestination: string }) {
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Lead"
        WHERE "id" = ${input.leadId} AND "userId" = ${input.userId}
        FOR UPDATE
      `
      if (!locked.length) return { ok: false as const, reason: 'NOT_FOUND' as const }

      const lead = await tx.lead.findFirst({
        where: { id: input.leadId, userId: input.userId },
        include: { keyword: true, crmDelivery: true },
      })
      if (!lead) return { ok: false as const, reason: 'NOT_FOUND' as const }
      if (lead.crmExportedAt || lead.crmDelivery?.status === 'DELIVERED') {
        return { ok: false as const, reason: 'ALREADY_DELIVERED' as const }
      }
      if (lead.crmDelivery) {
        return {
          ok: true as const,
          queued: lead.crmDelivery.status === 'QUEUED',
          deliveryId: lead.crmDelivery.id,
          existing: true,
          status: lead.crmDelivery.status,
        }
      }

      const payload: Prisma.InputJsonObject = {
        id: lead.id,
        platform: lead.platform,
        author: lead.author,
        content: lead.content,
        url: lead.url,
        keyword: lead.keyword.phrase,
        status: lead.status,
        createdAt: lead.createdAt.toISOString(),
      }
      const delivery = await tx.crmExportDelivery.create({
        data: {
          userId: input.userId,
          leadId: lead.id,
          payload,
          destinationFingerprint: destinationFingerprint(input.normalizedDestination),
        },
      })
      await tx.durableJob.create({
        data: {
          userId: input.userId,
          kind: 'CRM_EXPORT',
          dedupeKey: `crm:${delivery.id}`,
          crmDeliveryId: delivery.id,
        },
      })
      return {
        ok: true as const,
        queued: true as const,
        deliveryId: delivery.id,
        existing: false,
        status: 'QUEUED',
      }
    })
  }

  static async processClaimedJob(job: ClaimedDurableJob) {
    if (!job.crmDeliveryId) throw new DurableJobError('CRM_DELIVERY_TARGET_MISSING')
    const delivery = await prisma.crmExportDelivery.findFirst({
      where: { id: job.crmDeliveryId, userId: job.userId },
      include: { user: { select: { crmWebhookUrl: true } } },
    })
    if (!delivery) throw new DurableJobError('CRM_DELIVERY_NOT_FOUND')
    if (delivery.status === 'DELIVERED') {
      await DurableJobRepository.markSucceeded(job)
      return
    }
    if (delivery.status !== 'QUEUED') throw new DurableJobError('CRM_DELIVERY_NOT_QUEUED')

    const currentDestination = normalizeCrmWebhookUrl(delivery.user.crmWebhookUrl)
    if (!currentDestination) throw new DurableJobError('CRM_DESTINATION_MISSING')
    const currentFingerprint = destinationFingerprint(currentDestination)
    if (!fingerprintsMatch(currentFingerprint, delivery.destinationFingerprint)) {
      throw new DurableJobError('CRM_DESTINATION_CHANGED')
    }

    // postCrmWebhook resolves DNS and rejects private/mixed answers on every
    // attempt. The stable keys let destinations suppress a replay if the
    // response is lost after they accept the request.
    const response = await postCrmWebhook(currentDestination, delivery.payload, {
      idempotencyKey: `coquest-crm-${delivery.id}`,
      deliveryId: delivery.id,
    })
    if (!response.ok) throw new CrmHttpError(response.status)

    await prisma.$transaction(async (tx) => {
      const fenced = await tx.$queryRaw<Array<{ id: string }>>`
        UPDATE "DurableJob"
        SET
          "status" = 'SUCCEEDED',
          "leaseOwner" = NULL,
          "leaseExpiresAt" = NULL,
          "completedAt" = clock_timestamp(),
          "updatedAt" = clock_timestamp()
        WHERE "id" = ${job.id}
          AND "status" = 'RUNNING'
          AND "leaseOwner" = ${job.leaseOwner}
          AND "leaseGeneration" = ${job.leaseGeneration}
        RETURNING "id"
      `
      if (!fenced.length) return

      const marked = await tx.crmExportDelivery.updateMany({
        where: { id: delivery.id, userId: job.userId, status: 'QUEUED' },
        data: {
          status: 'DELIVERED',
          responseStatus: response.status,
          deliveredAt: new Date(),
          lastErrorCode: null,
        },
      })
      if (marked.count !== 1) return

      const convertedAt = new Date()
      const lead = await tx.lead.updateMany({
        where: { id: delivery.leadId, userId: job.userId, crmExportedAt: null },
        data: { crmExportedAt: convertedAt },
      })
      if (lead.count === 1) {
        await tx.user.update({
          where: { id: job.userId },
          data: { questsExported: { increment: 1 } },
        })

        /**
         * `lead.converted`, emitted in the delivery-completion transaction behind the
         * `crmExportedAt: null` guard.
         *
         * Conversion is defined as a successful CRM export: the user cared enough about this
         * lead to push it into the system they actually sell from. That is the strongest
         * intent signal the product currently records — `LeadStatus` has no CONVERTED member,
         * and `VIEWED` is never written by anything.
         *
         * The null guard is the exactly-once hook, and it matters more here than elsewhere
         * because Gamify pays XP on this event: a redelivered job whose lead already carries
         * `crmExportedAt` updates zero rows and never reaches this branch, so a retry cannot
         * mint a second reward.
         */
        await EventStore.writeOutbox(
          EventFactory.create({
            type: 'lead.converted',
            version: 1,
            actorId: job.userId,
            source: 'CrmDeliveryService',
            idempotencyKey: `lead.converted:${delivery.leadId}`,
            payload: {
              leadId: delivery.leadId,
              opportunityId: delivery.leadId,
              conversionType: 'CRM_EXPORTED',
              convertedAt: convertedAt.toISOString(),
            },
          }),
          tx,
        )
      }
    })
  }

  static async handleClaimedJobFailure(job: ClaimedDurableJob, error: unknown) {
    const errorCode = durableErrorCode(error)
    const responseStatus = error instanceof CrmHttpError ? error.responseStatus : undefined
    if (job.attempts < job.maxAttempts) {
      const fenced = await DurableJobRepository.scheduleRetry(job, job.attempts, errorCode)
      if (fenced && job.crmDeliveryId) {
        await prisma.crmExportDelivery.updateMany({
          where: { id: job.crmDeliveryId, userId: job.userId, status: 'QUEUED' },
          data: { lastErrorCode: errorCode, ...(responseStatus ? { responseStatus } : {}) },
        })
      }
      return fenced
    }
    if (!job.crmDeliveryId) throw new DurableJobError('CRM_DELIVERY_TARGET_MISSING')

    return prisma.$transaction(async (tx) => {
      const fenced = await tx.$queryRaw<Array<{ id: string }>>`
        UPDATE "DurableJob"
        SET
          "status" = 'DEAD',
          "leaseOwner" = NULL,
          "leaseExpiresAt" = NULL,
          "lastErrorCode" = ${errorCode},
          "deadAt" = clock_timestamp(),
          "updatedAt" = clock_timestamp()
        WHERE "id" = ${job.id}
          AND "status" = 'RUNNING'
          AND "leaseOwner" = ${job.leaseOwner}
          AND "leaseGeneration" = ${job.leaseGeneration}
        RETURNING "id"
      `
      if (!fenced.length) return false
      await tx.crmExportDelivery.updateMany({
        where: { id: job.crmDeliveryId!, userId: job.userId, status: 'QUEUED' },
        data: {
          status: 'DEAD',
          lastErrorCode: errorCode,
          ...(responseStatus ? { responseStatus } : {}),
        },
      })
      return true
    })
  }
}
