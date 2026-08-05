import 'server-only'

import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { isCurrentPaidSubscription } from '@/src/modules/billing/domain/entitlements'
import {
  DurableJobRepository,
  type ClaimedDurableJob,
} from '@/src/modules/core/jobs/DurableJobRepository'
import { durableErrorCode, DurableJobError } from '@/src/modules/core/jobs/jobErrors'
import { aggregateProviderAttempts } from '../domain/providerTruth'
import { ScanProviderService } from './ScanProviderService'

const SCAN_WINDOW_MS = 15 * 60_000

type DbClient = Prisma.TransactionClient
type ScanTrigger = 'MANUAL' | 'SCHEDULED'

function scanWindow(now: Date) {
  return new Date(Math.floor(now.getTime() / SCAN_WINDOW_MS) * SCAN_WINDOW_MS)
}

async function databaseNow(tx: DbClient) {
  const [row] = await tx.$queryRaw<Array<{ now: Date }>>`
    SELECT clock_timestamp() AS "now"
  `
  // Infrastructure failure, not an operational one: `clock_timestamp()` returning no row
  // means the connection is broken, so there is no 4xx that describes it. It renders as
  // 500 through withApiHandler either way, and AppError would add a misleading
  // `isOperational: true`.
  if (!row) throw new Error('Database clock unavailable')
  return row.now
}

async function refundScanInTransaction(tx: DbClient, scanRunId: string, errorCode: string) {
  const run = await tx.scanRun.findUnique({ where: { id: scanRunId } })
  if (!run || run.status === 'SUCCEEDED' || run.status === 'FAILED_REFUNDED') return false

  const debit = await tx.creditLedgerEntry.findUnique({
    where: { sourceType_sourceId: { sourceType: 'SCAN_RUN_DEBIT', sourceId: run.id } },
  })
  if (!debit || debit.userId !== run.userId || debit.delta !== -1) {
    throw new DurableJobError('SCAN_DEBIT_LEDGER_MISSING')
  }

  const refund = await tx.creditLedgerEntry.createMany({
    data: [{
      userId: run.userId,
      delta: 1,
      reason: 'SCAN_RUN_REFUND_TERMINAL_FAILURE',
      sourceType: 'SCAN_RUN_REFUND',
      sourceId: run.id,
    }],
    skipDuplicates: true,
  })
  if (refund.count === 1) {
    await tx.user.update({
      where: { id: run.userId },
      data: { questsRemaining: { increment: 1 } },
    })
  }
  await tx.scanRun.updateMany({
    where: { id: run.id, status: { in: ['QUEUED', 'RUNNING'] } },
    data: {
      status: 'FAILED_REFUNDED',
      providerSucceeded: false,
      lastErrorCode: errorCode,
      completedAt: new Date(),
    },
  })
  return refund.count === 1
}

export async function enqueueScanInTransaction(
  tx: DbClient,
  userId: string,
  trigger: ScanTrigger,
) {
  const now = await databaseNow(tx)
  const [lockedUser] = await tx.$queryRaw<Array<{ id: string; questsRemaining: number }>>`
    SELECT "id", "questsRemaining" FROM "User" WHERE "id" = ${userId} FOR UPDATE
  `
  if (!lockedUser) throw new DurableJobError('SCAN_USER_NOT_FOUND')

  const windowStartedAt = scanWindow(now)
  const activeKey = `${userId}:${windowStartedAt.toISOString()}`
  const existing = await tx.scanRun.findUnique({ where: { activeKey } })
  if (existing) {
    return { queued: false as const, existing: true as const, runId: existing.id }
  }

  const [activeKeywordCount, subscription] = await Promise.all([
    tx.trackedKeyword.count({ where: { userId, active: true } }),
    tx.billingSubscription.findUnique({ where: { userId } }),
  ])
  if (!activeKeywordCount) return { queued: false as const, reason: 'NO_ACTIVE_KEYWORDS' as const }
  if (!subscription || !isCurrentPaidSubscription(subscription, now)) {
    return { queued: false as const, reason: 'NOT_ENTITLED' as const }
  }
  if (lockedUser.questsRemaining < 1) {
    return { queued: false as const, reason: 'NO_CREDITS' as const }
  }

  const run = await tx.scanRun.create({
    data: { userId, trigger, windowStartedAt, activeKey },
  })
  const debited = await tx.user.updateMany({
    where: { id: userId, questsRemaining: { gte: 1 } },
    data: { questsRemaining: { decrement: 1 } },
  })
  if (debited.count !== 1) throw new DurableJobError('SCAN_CREDIT_DEBIT_RACE')

  await tx.creditLedgerEntry.create({
    data: {
      userId,
      delta: -1,
      reason: trigger === 'MANUAL' ? 'MANUAL_SCAN_DEBIT' : 'SCHEDULED_SCAN_DEBIT',
      sourceType: 'SCAN_RUN_DEBIT',
      sourceId: run.id,
    },
  })
  await tx.durableJob.create({
    data: {
      userId,
      kind: 'TENANT_SCAN',
      dedupeKey: `scan:${run.id}`,
      scanRunId: run.id,
    },
  })
  return { queued: true as const, existing: false as const, runId: run.id }
}

export class ScanRunService {
  static async enqueueManual(userId: string) {
    return prisma.$transaction((tx) => enqueueScanInTransaction(tx, userId, 'MANUAL'))
  }

  static async processClaimedJob(job: ClaimedDurableJob) {
    if (!job.scanRunId) throw new DurableJobError('SCAN_RUN_TARGET_MISSING')
    const run = await prisma.scanRun.findFirst({
      where: { id: job.scanRunId, userId: job.userId },
    })
    if (!run) throw new DurableJobError('SCAN_RUN_NOT_FOUND')
    if (run.status === 'SUCCEEDED') {
      await DurableJobRepository.markSucceeded(job)
      return
    }

    await prisma.scanRun.updateMany({
      where: { id: run.id, status: { in: ['QUEUED', 'RUNNING'] } },
      data: { status: 'RUNNING' },
    })

    const result = await ScanProviderService.scanTenant(run.userId, run.id)
    if (!result.providerSucceeded) {
      throw new DurableJobError(result.errorCode ?? 'ALL_SCAN_PROVIDERS_UNAVAILABLE')
    }

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

      await tx.scanRun.update({
        where: { id: run.id },
        data: {
          status: 'SUCCEEDED',
          providerSucceeded: true,
          leadsCreated: result.leadsCreated,
          lastErrorCode: result.errorCode ?? null,
          completedAt: new Date(),
        },
      })
      await tx.tenantScanSchedule.updateMany({
        where: { userId: run.userId },
        data: { lastCompletedAt: new Date() },
      })
    })
  }

  static async handleClaimedJobFailure(job: ClaimedDurableJob, error: unknown) {
    const errorCode = durableErrorCode(error)
    if (job.attempts < job.maxAttempts) {
      return DurableJobRepository.scheduleRetry(job, job.attempts, errorCode)
    }
    if (!job.scanRunId) throw new DurableJobError('SCAN_RUN_TARGET_MISSING')

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
      return refundScanInTransaction(tx, job.scanRunId!, errorCode)
    })
  }

  static async getStatus(userId: string, scanRunId: string) {
    const run = await prisma.scanRun.findFirst({
      where: { id: scanRunId, userId },
      select: {
        id: true,
        status: true,
        leadsCreated: true,
        lastErrorCode: true,
        completedAt: true,
        user: { select: { questsRemaining: true } },
        providerAttempts: {
          select: {
            provider: true,
            outcome: true,
            resultCount: true,
            insertedCount: true,
            rateLimitResetAt: true,
          },
        },
      },
    })
    if (!run) return null

    const provider = aggregateProviderAttempts(run.providerAttempts)
    return {
      id: run.id,
      status: run.status,
      counts: {
        leadsCreated: run.leadsCreated,
        providerAttempts: run.providerAttempts.length,
        providerResults: run.providerAttempts.reduce(
          (total, attempt) => total + attempt.resultCount,
          0,
        ),
      },
      completedAt: run.completedAt,
      refunded: run.status === 'FAILED_REFUNDED',
      errorCode: run.lastErrorCode,
      balance: run.user.questsRemaining,
      provider,
    }
  }

  static refundScanInTransaction = refundScanInTransaction
}
