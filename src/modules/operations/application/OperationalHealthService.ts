import 'server-only'

import prisma from '@/lib/prisma'
import { isDatabaseSessionUtc } from '@/src/modules/core/jobs/databaseClock'
import { machineSecretsDistinctAndStrong } from '@/src/modules/core/security/machineBearer'
import {
  accountDeletionConfigurationReady,
  accountDeletionEnabled,
} from '@/src/modules/lifecycle/domain/accountDeletion'
import { OPERATIONAL_HEARTBEAT_ID } from './OperationalHeartbeatService'

const STALE_LEASE_GRACE_MS = 5 * 60 * 1000
const BACKLOG_AGE_BREACH_MS = 5 * 60 * 1000
const HEARTBEAT_STALE_MS = 3 * 60 * 1000
const STRIPE_PROCESSING_STALE_MS = 10 * 60 * 1000

/*
 * Outbox breach thresholds.
 *
 * Every other bucket in this snapshot breaches at one row: a DEAD job, an expired
 * lease and an overdue schedule are each individually an incident. The two outbox
 * buckets are different — they are volume signals, and scoring them at one row would
 * make the readiness probe flap on a single bad payload — so they are counted in full
 * for operators but only *score* above these thresholds.
 *
 * DEAD_LETTERS: a DomainEventLog row reaches FAILED only after maxAttempts (5)
 * consumer failures, and FAILED is terminal — nothing prunes it and no drain will pick
 * it up again. One such row is a single poison event: real, worth a ticket, not an
 * outage. Five is the smallest count that a single bad payload cannot explain, so it is
 * the point where the evidence says the consumer is broken rather than the event. Note
 * the consequence of terminal-and-unpruned: once five dead letters exist the probe stays
 * degraded until an operator actually resolves them. That is intended. Dead letters are
 * silent data loss, and a counter that decays on its own would hide them.
 *
 * AGED_READY: the cron drains at most 10 events per minute (EVENT_DRAIN_BATCH_SIZE,
 * once-a-minute schedule), so BACKLOG_AGE_BREACH_MS of 5 minutes of ready-and-unclaimed
 * work is ~50 drain slots that passed a row by. Below 50 aged rows the drain is merely a
 * pass or two behind an arrival burst and will catch up on its own; above it, arrivals
 * are outrunning the ~600 events/hour of drain capacity and the backlog grows without
 * bound. That is the condition worth failing readiness for.
 */
const OUTBOX_DEAD_LETTER_BREACH_COUNT = 5
const OUTBOX_AGED_READY_BREACH_COUNT = 50

function configured(name: string) {
  return Boolean(process.env[name]?.trim())
}

function billingConfigurationReady() {
  if (process.env.SUBSCRIPTION_CHECKOUT_ENABLED !== 'true') return true
  return [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_BETA',
    'STRIPE_LIVEMODE',
    'NEXTAUTH_URL',
  ].every(configured)
}

export class OperationalHealthService {
  static async snapshot(now = new Date()) {
    const staleBefore = new Date(now.getTime() - STALE_LEASE_GRACE_MS)
    const backlogBefore = new Date(now.getTime() - BACKLOG_AGE_BREACH_MS)
    const heartbeatStaleBefore = new Date(now.getTime() - HEARTBEAT_STALE_MS)
    const stripeProcessingStaleBefore = new Date(now.getTime() - STRIPE_PROCESSING_STALE_MS)
    const [
      deadJobs,
      staleJobs,
      agedReadyJobs,
      deadDeletions,
      staleDeletions,
      agedReadyDeletions,
      staleAwaitingIdentityDeleteDeletions,
      overdueScanSchedules,
      failedStripeWebhooks,
      staleProcessingStripeWebhooks,
      failedOutboxEvents,
      agedReadyOutboxEvents,
      heartbeat,
      timezoneRows,
    ] = await Promise.all([
      prisma.durableJob.count({ where: { status: 'DEAD' } }),
      prisma.durableJob.count({
        where: { status: 'RUNNING', leaseExpiresAt: { lt: staleBefore } },
      }),
      prisma.durableJob.count({
        where: {
          status: { in: ['PENDING', 'RETRY_WAIT'] },
          nextAttemptAt: { lt: backlogBefore },
        },
      }),
      prisma.accountDeletionRequest.count({ where: { status: 'DEAD' } }),
      prisma.accountDeletionRequest.count({
        where: { status: 'RUNNING', leaseExpiresAt: { lt: staleBefore } },
      }),
      prisma.accountDeletionRequest.count({
        where: {
          status: { in: ['PENDING', 'RETRY_WAIT'] },
          availableAt: { lt: backlogBefore },
        },
      }),
      prisma.accountDeletionRequest.count({
        where: {
          status: 'AWAITING_IDENTITY_DELETE',
          updatedAt: { lt: backlogBefore },
        },
      }),
      prisma.tenantScanSchedule.count({
        where: { enabled: true, nextDueAt: { lt: backlogBefore } },
      }),
      prisma.stripeWebhookEvent.count({ where: { status: 'FAILED' } }),
      prisma.stripeWebhookEvent.count({
        where: {
          status: 'PROCESSING',
          updatedAt: { lt: stripeProcessingStaleBefore },
        },
      }),
      /*
       * True dead letters. FAILED is terminal in EventStore — markFailed is only
       * reached at maxAttempts and claimPendingBatch deliberately refuses to
       * resurrect a FAILED row — so every row here is an event that will never be
       * delivered until an operator intervenes.
       *
       * Index: equality on the leading column of @@index([status, availableAt,
       * createdAt]).
       */
      prisma.domainEventLog.count({ where: { status: 'FAILED' } }),
      /*
       * Ready-but-undrained work: PENDING with availableAt already in the past.
       * A row awaiting a backoff retry has availableAt in the future and is
       * correctly invisible here; only work the drain could have taken and did not
       * is counted. Stale PROCESSING rows are excluded on purpose — claimPendingBatch
       * reclaims them once their lease expires, so they are self-healing and are not
       * evidence that the drain is behind.
       *
       * Index: equality on "status" plus a range on "availableAt" is exactly the
       * leading two columns of @@index([status, availableAt, createdAt]).
       * claimPendingBatch's `attempts < maxAttempts` guard is intentionally NOT
       * repeated here: a column-to-column comparison is not indexable, and a PENDING
       * row stranded above maxAttempts (an operator lowering the cap) is precisely a
       * stuck row this bucket should be reporting.
       */
      prisma.domainEventLog.count({
        where: { status: 'PENDING', availableAt: { lt: backlogBefore } },
      }),
      prisma.operationalHeartbeat.findUnique({
        where: { id: OPERATIONAL_HEARTBEAT_ID },
        select: { lastSucceededAt: true, lastErrorCode: true },
      }),
      prisma.$queryRaw<Array<{ timezone: string }>>`SELECT current_setting('TimeZone') AS "timezone"`,
    ])
    const databaseTimezone = isDatabaseSessionUtc(timezoneRows[0]?.timezone)
      ? 'utc' as const
      : 'non_utc' as const

    const lifecycleEnabled = accountDeletionEnabled()
    const workerEnabled = process.env.DURABLE_WORKER_ENABLED === 'true'
    const machineAuthReady = machineSecretsDistinctAndStrong([
      process.env.CRON_SECRET,
      process.env.OPS_SECRET,
    ])
    const workerHeartbeat = heartbeat?.lastErrorCode
      ? 'failed' as const
      : !heartbeat?.lastSucceededAt
      ? 'missing' as const
      : heartbeat.lastSucceededAt < heartbeatStaleBefore
        ? 'stale' as const
        : 'healthy' as const
    const components = {
      database: 'reachable' as const,
      databaseTimezone,
      durableWorker: workerEnabled ? 'enabled' as const : 'disabled' as const,
      machineAuth: machineAuthReady ? 'configured' as const : 'misconfigured' as const,
      workerHeartbeat,
      clerkLifecycle: lifecycleEnabled
        ? (accountDeletionConfigurationReady() ? 'enabled' as const : 'misconfigured' as const)
        : 'disabled' as const,
      billing: billingConfigurationReady() ? 'configured' as const : 'misconfigured' as const,
    }
    // Buckets where a single row is already an incident; every row scores.
    const perRowCounts = {
      deadJobs,
      staleJobs,
      agedReadyJobs,
      deadDeletions,
      staleDeletions,
      agedReadyDeletions,
      staleAwaitingIdentityDeleteDeletions,
      overdueScanSchedules,
      failedStripeWebhooks,
      staleProcessingStripeWebhooks,
    }
    // Volume buckets: reported in full, scored only past their threshold above.
    const outboxCounts = {
      failedOutboxEvents,
      agedReadyOutboxEvents,
    }
    const counts = { ...perRowCounts, ...outboxCounts }
    const outboxBreaches =
      (failedOutboxEvents >= OUTBOX_DEAD_LETTER_BREACH_COUNT ? 1 : 0)
      + (agedReadyOutboxEvents >= OUTBOX_AGED_READY_BREACH_COUNT ? 1 : 0)
    const issueCount =
      Object.values(perRowCounts).reduce((sum, count) => sum + count, 0) + outboxBreaches
    const ready = components.durableWorker === 'enabled'
      && components.databaseTimezone === 'utc'
      && components.machineAuth === 'configured'
      && components.workerHeartbeat === 'healthy'
      && components.clerkLifecycle === 'enabled'
      && components.billing === 'configured'
      && issueCount === 0

    return {
      status: ready ? 'ready' as const : 'degraded' as const,
      checkedAt: now.toISOString(),
      components,
      counts,
      clock: {
        workerLastSucceededAt: heartbeat?.lastSucceededAt?.toISOString() ?? null,
        workerLastErrorCode: heartbeat?.lastErrorCode ?? null,
      },
    }
  }
}
