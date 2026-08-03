import 'server-only'

import prisma from '@/lib/prisma'
import { MAX_ACTIVE_KEYWORDS_PER_TENANT } from '@/src/modules/keywords/application/KeywordService'
import { enqueueScanInTransaction } from './ScanRunService'

const SCHEDULE_INTERVAL_MS = 24 * 60 * 60_000

type DueSchedule = { userId: string }
type OverLimitTenant = { userId: string; activeKeywordCount: number }

export class ActiveKeywordLimitExceededError extends Error {
  readonly code = 'ACTIVE_KEYWORD_LIMIT_EXCEEDED'

  constructor() {
    super('An active keyword count exceeds the provider budget')
    this.name = 'ActiveKeywordLimitExceededError'
  }
}

function boundedBatchSize(batchSize: number) {
  return Number.isSafeInteger(batchSize)
    ? Math.min(25, Math.max(1, batchSize))
    : 10
}

export class ScanSchedulerService {
  /**
   * Repairs the migration/deploy dual-write window on every cycle. This
   * transaction only locks schedule rows and commits before dispatch acquires
   * tenant locks, so it cannot invert the User -> TenantScanSchedule order.
   */
  static async reconcileSchedules() {
    return prisma.$transaction(async (tx) => {
      const overLimit = await tx.$queryRaw<OverLimitTenant[]>`
        SELECT keyword."userId", COUNT(*)::integer AS "activeKeywordCount"
        FROM "TrackedKeyword" AS keyword
        WHERE keyword."active" = true
        GROUP BY keyword."userId"
        HAVING COUNT(*) > ${MAX_ACTIVE_KEYWORDS_PER_TENANT}
        ORDER BY keyword."userId"
        LIMIT 1
      `
      if (overLimit.length) throw new ActiveKeywordLimitExceededError()

      const created = await tx.$executeRaw`
        INSERT INTO "TenantScanSchedule" (
          "userId", "enabled", "nextDueAt", "createdAt", "updatedAt"
        )
        SELECT
          keyword."userId", false, clock_timestamp(), clock_timestamp(), clock_timestamp()
        FROM "TrackedKeyword" AS keyword
        WHERE keyword."active" = true
        GROUP BY keyword."userId"
        ON CONFLICT ("userId") DO NOTHING
      `

      const disabled = await tx.$executeRaw`
        UPDATE "TenantScanSchedule" AS schedule
        SET
          "enabled" = false,
          "updatedAt" = clock_timestamp()
        WHERE schedule."enabled" = true
          AND NOT EXISTS (
            SELECT 1
            FROM "TrackedKeyword" AS keyword
            WHERE keyword."userId" = schedule."userId"
              AND keyword."active" = true
          )
      `

      return { created, disabled }
    })
  }

  static async enqueueDueSchedules(batchSize = 10) {
    const limit = boundedBatchSize(batchSize)
    const reconciled = await this.reconcileSchedules()

    return prisma.$transaction(async (tx) => {
      // This is only an ordered candidate read. Locks are acquired below in
      // User -> TenantScanSchedule order, matching keyword acceptance.
      const candidates = await tx.$queryRaw<DueSchedule[]>`
        SELECT schedule."userId"
        FROM "TenantScanSchedule" AS schedule
        WHERE schedule."enabled" = true
          AND schedule."nextDueAt" <= clock_timestamp()
        ORDER BY schedule."nextDueAt", schedule."userId"
        LIMIT ${limit}
      `

      let due = 0
      let queued = 0
      let existing = 0
      let skipped = 0
      for (const candidate of candidates) {
        const lockedUser = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT app_user."id"
          FROM "User" AS app_user
          WHERE app_user."id" = ${candidate.userId}
          FOR UPDATE OF app_user SKIP LOCKED
        `
        if (!lockedUser.length) continue

        const schedule = await tx.$queryRaw<DueSchedule[]>`
          SELECT schedule."userId"
          FROM "TenantScanSchedule" AS schedule
          WHERE schedule."userId" = ${candidate.userId}
            AND schedule."enabled" = true
            AND schedule."nextDueAt" <= clock_timestamp()
          FOR UPDATE OF schedule SKIP LOCKED
        `
        if (!schedule.length) continue
        due += 1

        const result = await enqueueScanInTransaction(tx, candidate.userId, 'SCHEDULED')
        if (result.queued) queued += 1
        else if ('existing' in result && result.existing) existing += 1
        else skipped += 1

        await tx.$executeRaw`
          UPDATE "TenantScanSchedule"
          SET
            "nextDueAt" = clock_timestamp() + (${SCHEDULE_INTERVAL_MS} * INTERVAL '1 millisecond'),
            "lastEnqueuedAt" = CASE
              WHEN ${result.queued} THEN clock_timestamp()
              ELSE "lastEnqueuedAt"
            END,
            "updatedAt" = clock_timestamp()
          WHERE "userId" = ${candidate.userId}
        `
      }

      return { due, queued, existing, skipped, reconciled }
    })
  }
}
