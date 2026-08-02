import 'server-only'

import type { DurableJob } from '@prisma/client'
import prisma from '@/lib/prisma'

const DEFAULT_LEASE_MS = 60_000
const RETRY_BASE_MS = 5_000
const RETRY_CAP_MS = 15 * 60_000

function boundedInteger(value: number, min: number, max: number) {
  if (!Number.isSafeInteger(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function retryDelayMs(attempts: number) {
  const exponent = Math.max(0, boundedInteger(attempts, 1, 20) - 1)
  return Math.min(RETRY_CAP_MS, RETRY_BASE_MS * (2 ** exponent))
}

export type ClaimedDurableJob = DurableJob & {
  leaseOwner: string
  leaseExpiresAt: Date
}

export type JobFence = Pick<ClaimedDurableJob, 'id' | 'leaseOwner' | 'leaseGeneration'>

export class DurableJobRepository {
  /**
   * Claims ready work using the database clock. The anti-join chooses only the
   * oldest ready job per tenant; SKIP LOCKED lets concurrent workers make
   * progress without letting one noisy tenant consume the whole batch.
   */
  static async claimBatch(input: {
    workerId: string
    batchSize?: number
    leaseMs?: number
  }): Promise<ClaimedDurableJob[]> {
    const batchSize = boundedInteger(input.batchSize ?? 4, 1, 25)
    const leaseMs = boundedInteger(input.leaseMs ?? DEFAULT_LEASE_MS, 10_000, 5 * 60_000)

    return prisma.$transaction(async (tx) => tx.$queryRaw<ClaimedDurableJob[]>`
      WITH exhausted_candidates AS (
        SELECT exhausted_job."id"
        FROM "DurableJob" AS exhausted_job
        WHERE exhausted_job."status" = 'RUNNING'
          AND exhausted_job."leaseExpiresAt" <= clock_timestamp()
          AND exhausted_job."attempts" >= exhausted_job."maxAttempts"
        ORDER BY exhausted_job."leaseExpiresAt", exhausted_job."createdAt", exhausted_job."id"
        LIMIT ${batchSize}
        FOR UPDATE OF exhausted_job SKIP LOCKED
      ), exhausted AS (
        UPDATE "DurableJob" AS exhausted_job
        SET
          "status" = 'DEAD',
          "leaseOwner" = NULL,
          "leaseExpiresAt" = NULL,
          "lastErrorCode" = 'LEASE_EXPIRED_AT_MAX_ATTEMPTS',
          "deadAt" = clock_timestamp(),
          "updatedAt" = clock_timestamp()
        FROM exhausted_candidates
        WHERE exhausted_job."id" = exhausted_candidates."id"
        RETURNING exhausted_job."crmDeliveryId"
      ), dead_deliveries AS (
        UPDATE "CrmExportDelivery" AS delivery
        SET
          "status" = 'DEAD',
          "lastErrorCode" = 'LEASE_EXPIRED_AT_MAX_ATTEMPTS',
          "updatedAt" = clock_timestamp()
        FROM exhausted
        WHERE delivery."id" = exhausted."crmDeliveryId"
          AND delivery."status" = 'QUEUED'
        RETURNING delivery."id"
      ), candidates AS (
        SELECT candidate."id"
        FROM "DurableJob" AS candidate
        WHERE (
          (
            candidate."status" IN ('PENDING', 'RETRY_WAIT')
            AND candidate."nextAttemptAt" <= clock_timestamp()
          )
          OR (
            candidate."status" = 'RUNNING'
            AND candidate."leaseExpiresAt" <= clock_timestamp()
          )
        )
        AND candidate."attempts" < candidate."maxAttempts"
        AND NOT EXISTS (
          SELECT 1
          FROM "DurableJob" AS active
          WHERE active."userId" = candidate."userId"
            AND active."id" <> candidate."id"
            AND active."status" = 'RUNNING'
            AND active."leaseExpiresAt" > clock_timestamp()
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "DurableJob" AS earlier
          WHERE earlier."userId" = candidate."userId"
            AND earlier."attempts" < earlier."maxAttempts"
            AND (
              (
                earlier."status" IN ('PENDING', 'RETRY_WAIT')
                AND earlier."nextAttemptAt" <= clock_timestamp()
              )
              OR (
                earlier."status" = 'RUNNING'
                AND earlier."leaseExpiresAt" <= clock_timestamp()
              )
            )
            AND (
              earlier."nextAttemptAt",
              earlier."createdAt",
              earlier."id"
            ) < (
              candidate."nextAttemptAt",
              candidate."createdAt",
              candidate."id"
            )
        )
        ORDER BY candidate."nextAttemptAt", candidate."createdAt", candidate."id"
        LIMIT ${batchSize}
        FOR UPDATE OF candidate SKIP LOCKED
      )
      UPDATE "DurableJob" AS job
      SET
        "status" = 'RUNNING',
        "attempts" = job."attempts" + 1,
        "leaseOwner" = ${input.workerId},
        "leaseGeneration" = job."leaseGeneration" + 1,
        "leaseExpiresAt" = clock_timestamp() + (${leaseMs} * INTERVAL '1 millisecond'),
        "lastErrorCode" = NULL,
        "updatedAt" = clock_timestamp()
      FROM candidates
      WHERE job."id" = candidates."id"
      RETURNING job.*
    `)
  }

  static async markSucceeded(fence: JobFence) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "DurableJob"
      SET
        "status" = 'SUCCEEDED',
        "leaseOwner" = NULL,
        "leaseExpiresAt" = NULL,
        "completedAt" = clock_timestamp(),
        "updatedAt" = clock_timestamp()
      WHERE "id" = ${fence.id}
        AND "status" = 'RUNNING'
        AND "leaseOwner" = ${fence.leaseOwner}
        AND "leaseGeneration" = ${fence.leaseGeneration}
      RETURNING "id"
    `
    return rows.length === 1
  }

  static async scheduleRetry(fence: JobFence, attempts: number, errorCode: string) {
    const delayMs = retryDelayMs(attempts)
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "DurableJob"
      SET
        "status" = 'RETRY_WAIT',
        "leaseOwner" = NULL,
        "leaseExpiresAt" = NULL,
        "nextAttemptAt" = clock_timestamp() + (${delayMs} * INTERVAL '1 millisecond'),
        "lastErrorCode" = ${errorCode},
        "updatedAt" = clock_timestamp()
      WHERE "id" = ${fence.id}
        AND "status" = 'RUNNING'
        AND "leaseOwner" = ${fence.leaseOwner}
        AND "leaseGeneration" = ${fence.leaseGeneration}
      RETURNING "id"
    `
    return rows.length === 1
  }
}
