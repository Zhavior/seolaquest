import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  durableCount: vi.fn(),
  deletionCount: vi.fn(),
  scheduleCount: vi.fn(),
  stripeCount: vi.fn(),
  outboxCount: vi.fn(),
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
    domainEventLog: { count: mocks.outboxCount },
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
    mocks.outboxCount.mockResolvedValue(0)
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
          failedOutboxEvents: 0,
          agedReadyOutboxEvents: 0,
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

  it('queries the outbox with index-supported predicates', async () => {
    // Call order: FAILED dead letters, then aged ready PENDING.
    await OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z'))

    // Equality on the leading column of @@index([status, availableAt, createdAt]).
    expect(mocks.outboxCount).toHaveBeenNthCalledWith(1, { where: { status: 'FAILED' } })
    // Equality + range on the leading two columns of the same index.
    expect(mocks.outboxCount).toHaveBeenNthCalledWith(2, {
      where: {
        status: 'PENDING',
        availableAt: { lt: new Date('2026-07-30T11:55:00Z') },
      },
    })
  })

  it('reports sub-threshold outbox counts without failing readiness', async () => {
    // Four dead letters is a poison-payload problem, not an outage; 49 aged ready
    // rows is a drain that is a few passes behind and will catch up.
    mocks.outboxCount.mockResolvedValueOnce(4).mockResolvedValueOnce(49)

    await expect(OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z')))
      .resolves.toMatchObject({
        status: 'ready',
        counts: { failedOutboxEvents: 4, agedReadyOutboxEvents: 49 },
      })
  })

  it('degrades once dead letters reach the outbox breach threshold', async () => {
    mocks.outboxCount.mockResolvedValueOnce(5).mockResolvedValueOnce(0)

    await expect(OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z')))
      .resolves.toMatchObject({
        status: 'degraded',
        counts: { failedOutboxEvents: 5, agedReadyOutboxEvents: 0 },
      })
  })

  it('degrades once the ready outbox backlog outruns drain capacity', async () => {
    mocks.outboxCount.mockResolvedValueOnce(0).mockResolvedValueOnce(50)

    await expect(OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z')))
      .resolves.toMatchObject({
        status: 'degraded',
        counts: { failedOutboxEvents: 0, agedReadyOutboxEvents: 50 },
      })
  })

  it('scores each breached outbox bucket once rather than per row', async () => {
    // A single breached bucket must not be able to mask an otherwise clean system,
    // nor inflate the issue signal in proportion to raw row volume.
    mocks.outboxCount.mockResolvedValueOnce(500).mockResolvedValueOnce(0)

    const snapshot = await OperationalHealthService.snapshot(new Date('2026-07-30T12:00:00Z'))
    expect(snapshot.status).toBe('degraded')
    expect(snapshot.counts.failedOutboxEvents).toBe(500)
  })
})
