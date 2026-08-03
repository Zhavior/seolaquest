import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  durableCount: vi.fn(),
  deletionCount: vi.fn(),
  scheduleCount: vi.fn(),
  stripeCount: vi.fn(),
  heartbeatFindUnique: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    durableJob: { count: mocks.durableCount },
    accountDeletionRequest: { count: mocks.deletionCount },
    tenantScanSchedule: { count: mocks.scheduleCount },
    stripeWebhookEvent: { count: mocks.stripeCount },
    operationalHeartbeat: { findUnique: mocks.heartbeatFindUnique },
    $queryRaw: mocks.queryRaw,
  },
}))

import { OperationalHealthService } from './OperationalHealthService'

describe('OperationalHealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.durableCount.mockResolvedValue(0)
    mocks.deletionCount.mockResolvedValue(0)
    mocks.scheduleCount.mockResolvedValue(0)
    mocks.stripeCount.mockResolvedValue(0)
    mocks.heartbeatFindUnique.mockResolvedValue({
      lastSucceededAt: new Date('2026-07-30T11:59:00Z'),
      lastErrorCode: null,
    })
    mocks.queryRaw.mockResolvedValue([{ timezone: 'UTC' }])
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('CRON_SECRET', 'cron-secret-0123456789abcdef012345678')
    vi.stubEnv('OPS_SECRET', 'ops-secret-0123456789abcdef0123456789')
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'true')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_clerk')
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'whsec_clerk')
    vi.stubEnv('DELETION_AUDIT_SECRET', 'deletion-secret')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_stripe')
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'false')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('reports ready only when configured and no durable failures exist', async () => {
    await expect(OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z')))
      .resolves.toMatchObject({
        status: 'ready',
        components: { workerHeartbeat: 'healthy', machineAuth: 'configured' },
        counts: {
          deadJobs: 0,
          agedReadyJobs: 0,
          deadDeletions: 0,
          agedReadyDeletions: 0,
          overdueScanSchedules: 0,
        },
        clock: {
          workerLastSucceededAt: '2026-07-30T11:59:00.000Z',
          workerLastErrorCode: null,
        },
      })
  })

  it('fails closed when the worker is disabled or a dead letter exists', async () => {
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'false')
    mocks.durableCount.mockResolvedValueOnce(2).mockResolvedValueOnce(0)
    await expect(OperationalHealthService.snapshot()).resolves.toMatchObject({
      status: 'degraded',
      components: { durableWorker: 'disabled' },
      counts: { deadJobs: 2 },
    })
  })

  it('fails readiness when destructive lifecycle processing is not explicitly enabled', async () => {
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'false')
    await expect(OperationalHealthService.snapshot()).resolves.toMatchObject({
      status: 'degraded',
      components: { clerkLifecycle: 'disabled' },
    })
  })

  it('fails readiness when machine secrets are weak or reused', async () => {
    vi.stubEnv('OPS_SECRET', process.env.CRON_SECRET!)
    await expect(OperationalHealthService.snapshot()).resolves.toMatchObject({
      status: 'degraded',
      components: { machineAuth: 'misconfigured' },
    })
  })

  it('fails readiness when the database session is not UTC', async () => {
    mocks.queryRaw.mockResolvedValue([{ timezone: 'America/Halifax' }])
    await expect(OperationalHealthService.snapshot()).resolves.toMatchObject({
      status: 'degraded',
      components: { databaseTimezone: 'non_utc' },
    })
  })

  it.each([
    ['missing', null],
    ['stale', { lastSucceededAt: new Date('2026-07-30T11:56:59Z'), lastErrorCode: null }],
    ['failed', { lastSucceededAt: new Date('2026-07-30T11:59:59Z'), lastErrorCode: 'WORKER_CYCLE_FAILED' }],
  ])('fails readiness when the worker heartbeat is %s', async (state, heartbeat) => {
    mocks.heartbeatFindUnique.mockResolvedValue(heartbeat)
    await expect(OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z')))
      .resolves.toMatchObject({
        status: 'degraded',
        components: { workerHeartbeat: state },
      })
  })

  it('degrades on age-breached runnable work and reports aggregate counts only', async () => {
    mocks.durableCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(4)
    mocks.deletionCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(2).mockResolvedValueOnce(0)
    mocks.scheduleCount.mockResolvedValue(3)

    const snapshot = await OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z'))
    expect(snapshot).toMatchObject({
      status: 'degraded',
      counts: { agedReadyJobs: 4, agedReadyDeletions: 2, overdueScanSchedules: 3 },
    })
    expect(mocks.durableCount).toHaveBeenNthCalledWith(3, {
      where: {
        status: { in: ['PENDING', 'RETRY_WAIT'] },
        nextAttemptAt: { lt: new Date('2026-07-30T11:55:00Z') },
      },
    })
    expect(mocks.deletionCount).toHaveBeenNthCalledWith(3, {
      where: {
        status: { in: ['PENDING', 'RETRY_WAIT'] },
        availableAt: { lt: new Date('2026-07-30T11:55:00Z') },
      },
    })
    expect(mocks.deletionCount).toHaveBeenNthCalledWith(4, {
      where: {
        status: 'AWAITING_IDENTITY_DELETE',
        updatedAt: { lt: new Date('2026-07-30T11:55:00Z') },
      },
    })
    expect(mocks.scheduleCount).toHaveBeenCalledWith({
      where: { enabled: true, nextDueAt: { lt: new Date('2026-07-30T11:55:00Z') } },
    })
  })

  it('degrades when AWAITING_IDENTITY_DELETE rows exceed the backlog age threshold', async () => {
    // Call order: DEAD, RUNNING+stale, PENDING|RETRY_WAIT+aged, AWAITING_IDENTITY_DELETE+aged
    mocks.deletionCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(3)

    const snapshot = await OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z'))
    expect(snapshot).toMatchObject({
      status: 'degraded',
      counts: { staleAwaitingIdentityDeleteDeletions: 3 },
    })
    expect(mocks.deletionCount).toHaveBeenNthCalledWith(4, {
      where: {
        status: 'AWAITING_IDENTITY_DELETE',
        updatedAt: { lt: new Date('2026-07-30T11:55:00Z') },
      },
    })
  })

  it('degrades when stale PROCESSING Stripe webhook rows exceed the lease grace threshold', async () => {
    // Call order: FAILED, PROCESSING+stale
    mocks.stripeCount.mockResolvedValueOnce(0).mockResolvedValueOnce(5)

    const snapshot = await OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z'))
    expect(snapshot).toMatchObject({
      status: 'degraded',
      counts: { staleProcessingStripeWebhooks: 5 },
    })
    expect(mocks.stripeCount).toHaveBeenNthCalledWith(2, {
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: new Date('2026-07-30T11:50:00Z') },
      },
    })
  })
})
