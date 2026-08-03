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
    const counts = {
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
    const issueCount = Object.values(counts).reduce((sum, count) => sum + count, 0)
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
