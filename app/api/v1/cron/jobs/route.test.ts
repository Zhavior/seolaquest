import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  runCycle: vi.fn(),
  accountDeletionEnabled: vi.fn(),
  processDeletionBatch: vi.fn(),
  assertDatabaseSessionUtc: vi.fn(),
  markStarted: vi.fn(),
  markSucceeded: vi.fn(),
  markFailed: vi.fn(),
  pruneProcessedStripeWebhooks: vi.fn(),
  registerAllEventConsumers: vi.fn(),
  processPendingBatch: vi.fn(),
}))

vi.mock('@/src/modules/core/jobs/JobWorkerService', () => ({
  JobWorkerService: { runCycle: mocks.runCycle },
}))
vi.mock('@/src/modules/lifecycle/domain/accountDeletion', () => ({
  accountDeletionEnabled: mocks.accountDeletionEnabled,
}))
vi.mock('@/src/modules/lifecycle/application/AccountDeletionWorker', () => ({
  AccountDeletionWorker: { processBatch: mocks.processDeletionBatch },
}))
vi.mock('@/src/modules/core/jobs/databaseClock', () => ({
  assertDatabaseSessionUtc: mocks.assertDatabaseSessionUtc,
}))
vi.mock('@/src/modules/operations/application/OperationalHeartbeatService', () => ({
  OperationalHeartbeatService: {
    markStarted: mocks.markStarted,
    markSucceeded: mocks.markSucceeded,
    markFailed: mocks.markFailed,
    pruneProcessedStripeWebhooks: mocks.pruneProcessedStripeWebhooks,
  },
  WORKER_CYCLE_FAILURE_CODE: 'WORKER_CYCLE_FAILED',
}))
vi.mock('@/src/modules/core/events/registerConsumers', () => ({
  registerAllEventConsumers: mocks.registerAllEventConsumers,
}))
vi.mock('@/src/modules/core/events/EventProcessor', () => ({
  EventProcessor: { processPendingBatch: mocks.processPendingBatch },
}))

import { GET } from './route'

const AUTHORIZED = {
  headers: { authorization: 'Bearer exact-secret-0123456789abcdef012345678' },
}

const NO_EVENTS = { claimedCount: 0, processedCount: 0, failedCount: 0 }

describe('GET /api/v1/cron/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('CRON_SECRET', 'exact-secret-0123456789abcdef012345678')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    mocks.runCycle.mockResolvedValue({ ok: true, processed: 2 })
    mocks.accountDeletionEnabled.mockReturnValue(false)
    mocks.processDeletionBatch.mockResolvedValue({ claimed: 1, completed: 1 })
    mocks.assertDatabaseSessionUtc.mockResolvedValue('UTC')
    mocks.markStarted.mockResolvedValue(undefined)
    mocks.markSucceeded.mockResolvedValue(undefined)
    mocks.markFailed.mockResolvedValue(undefined)
    mocks.pruneProcessedStripeWebhooks.mockResolvedValue({ processedStripeWebhooksDeleted: 0 })
    mocks.registerAllEventConsumers.mockReturnValue(undefined)
    mocks.processPendingBatch.mockResolvedValue(NO_EVENTS)
  })

  it('fails closed when the cron secret is missing', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const response = await GET(new Request('http://localhost/api/v1/cron/jobs'))
    expect(response.status).toBe(503)
    expect(mocks.runCycle).not.toHaveBeenCalled()
  })

  it.each(['false', ''])('fails closed when the authenticated worker switch is %s', async (enabled) => {
    vi.stubEnv('DURABLE_WORKER_ENABLED', enabled)
    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', {
      headers: { authorization: 'Bearer exact-secret-0123456789abcdef012345678' },
    }))
    expect(response.status).toBe(503)
    expect(mocks.runCycle).not.toHaveBeenCalled()
  })

  it('does not disclose a disabled worker to an invalid credential', async () => {
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'false')
    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', {
      headers: { authorization: 'Bearer wrong' },
    }))
    expect(response.status).toBe(401)
    expect(mocks.markStarted).not.toHaveBeenCalled()
  })

  it.each([null, 'exact-secret', 'Bearer wrong', 'bearer exact-secret'])(
    'rejects a non-exact Bearer credential: %s',
    async (authorization) => {
      const response = await GET(new Request('http://localhost/api/v1/cron/jobs', {
        headers: authorization ? { authorization } : undefined,
      }))
      expect(response.status).toBe(401)
    },
  )

  it('runs one bounded worker cycle for the exact credential', async () => {
    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', {
      headers: { authorization: 'Bearer exact-secret-0123456789abcdef012345678' },
    }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      lifecycle: { enabled: false },
      durable: { ok: true, processed: 2 },
      events: { ok: true, claimedCount: 0, processedCount: 0, failedCount: 0 },
      maintenance: { processedStripeWebhooksDeleted: 0 },
    })
    expect(mocks.runCycle).toHaveBeenCalledTimes(1)
  })

  it('fails closed before either worker when the database session is not UTC', async () => {
    mocks.assertDatabaseSessionUtc.mockRejectedValue(new Error('wrong zone'))
    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', {
      headers: { authorization: 'Bearer exact-secret-0123456789abcdef012345678' },
    }))
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      status: 'database_clock_unavailable',
    })
    expect(mocks.processDeletionBatch).not.toHaveBeenCalled()
    expect(mocks.runCycle).not.toHaveBeenCalled()
    expect(mocks.markStarted).not.toHaveBeenCalled()
  })

  it('runs enabled lifecycle deletion work before the durable queue', async () => {
    mocks.accountDeletionEnabled.mockReturnValue(true)
    const callOrder: string[] = []
    mocks.processDeletionBatch.mockImplementation(async () => {
      callOrder.push('lifecycle')
      return { claimed: 1, completed: 1 }
    })
    mocks.runCycle.mockImplementation(async () => {
      callOrder.push('durable')
      return { ok: true, processed: 2 }
    })

    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', {
      headers: { authorization: 'Bearer exact-secret-0123456789abcdef012345678' },
    }))
    expect(response.status).toBe(200)
    expect(callOrder).toEqual(['lifecycle', 'durable'])
    await expect(response.json()).resolves.toEqual({
      ok: true,
      lifecycle: { claimed: 1, completed: 1 },
      durable: { ok: true, processed: 2 },
      events: { ok: true, claimedCount: 0, processedCount: 0, failedCount: 0 },
      maintenance: { processedStripeWebhooksDeleted: 0 },
    })
  })

  it('records start before work and success only after both lanes and retention complete', async () => {
    mocks.accountDeletionEnabled.mockReturnValue(true)
    const callOrder: string[] = []
    mocks.markStarted.mockImplementation(async () => { callOrder.push('started') })
    mocks.processDeletionBatch.mockImplementation(async () => {
      callOrder.push('lifecycle')
      return { claimed: 0, completed: 0 }
    })
    mocks.runCycle.mockImplementation(async () => {
      callOrder.push('durable')
      return { ok: true, processed: 0 }
    })
    mocks.pruneProcessedStripeWebhooks.mockImplementation(async () => {
      callOrder.push('retention')
      return { processedStripeWebhooksDeleted: 7 }
    })
    mocks.markSucceeded.mockImplementation(async () => { callOrder.push('succeeded') })

    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', {
      headers: { authorization: 'Bearer exact-secret-0123456789abcdef012345678' },
    }))
    expect(response.status).toBe(200)
    expect(callOrder).toEqual(['started', 'lifecycle', 'durable', 'retention', 'succeeded'])
    await expect(response.json()).resolves.toMatchObject({
      maintenance: { processedStripeWebhooksDeleted: 7 },
    })
  })

  it('records a stable aggregate failure and never marks the cycle successful', async () => {
    mocks.runCycle.mockRejectedValue(new Error('contains private provider detail'))
    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', {
      headers: { authorization: 'Bearer exact-secret-0123456789abcdef012345678' },
    }))
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      errorCode: 'WORKER_CYCLE_FAILED',
    })
    expect(mocks.markStarted).toHaveBeenCalledTimes(1)
    expect(mocks.markFailed).toHaveBeenCalledWith('WORKER_CYCLE_FAILED')
    expect(mocks.markSucceeded).not.toHaveBeenCalled()
    expect(mocks.pruneProcessedStripeWebhooks).not.toHaveBeenCalled()
  })

  it('registers every consumer before a single outbox event is claimed', async () => {
    const callOrder: string[] = []
    mocks.registerAllEventConsumers.mockImplementation(() => {
      callOrder.push('register')
    })
    mocks.processPendingBatch.mockImplementation(async () => {
      callOrder.push('drain')
      return { claimedCount: 3, processedCount: 3, failedCount: 0 }
    })

    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', AUTHORIZED))

    expect(response.status).toBe(200)
    // Draining before registration would mark every event PROCESSED with zero
    // consumers, destroying it. The order is the whole point of the wiring.
    expect(callOrder).toEqual(['register', 'drain'])
    await expect(response.json()).resolves.toMatchObject({
      events: { ok: true, claimedCount: 3, processedCount: 3, failedCount: 0 },
    })
  })

  it('bounds the outbox batch so the drain cannot starve the durable job cycle', async () => {
    await GET(new Request('http://localhost/api/v1/cron/jobs', AUTHORIZED))

    expect(mocks.processPendingBatch).toHaveBeenCalledTimes(1)
    const [batchSize] = mocks.processPendingBatch.mock.calls[0] as [number]
    expect(batchSize).toBeGreaterThan(0)
    expect(batchSize).toBeLessThanOrEqual(25)
  })

  it('still reports the durable cycle when the outbox drain fails', async () => {
    mocks.processPendingBatch.mockRejectedValue(new Error('outbox unavailable'))

    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', AUTHORIZED))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      lifecycle: { enabled: false },
      durable: { ok: true, processed: 2 },
      events: { ok: false, errorCode: 'EVENT_DRAIN_FAILED' },
      maintenance: { processedStripeWebhooksDeleted: 0 },
    })
    expect(mocks.runCycle).toHaveBeenCalledTimes(1)
    expect(mocks.markSucceeded).toHaveBeenCalledTimes(1)
  })

  it('still drains the outbox when the durable job cycle fails', async () => {
    mocks.runCycle.mockRejectedValue(new Error('durable queue exploded'))
    let drained = false
    mocks.processPendingBatch.mockImplementation(async () => {
      drained = true
      return NO_EVENTS
    })

    const response = await GET(new Request('http://localhost/api/v1/cron/jobs', AUTHORIZED))

    expect(drained).toBe(true)
    expect(mocks.registerAllEventConsumers).toHaveBeenCalledTimes(1)
    // The aggregate failure contract for the durable lane is unchanged.
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      errorCode: 'WORKER_CYCLE_FAILED',
    })
  })

  it('never touches the outbox when an authorization or clock guard rejects the request', async () => {
    mocks.assertDatabaseSessionUtc.mockRejectedValue(new Error('wrong zone'))
    await GET(new Request('http://localhost/api/v1/cron/jobs', AUTHORIZED))

    vi.stubEnv('DURABLE_WORKER_ENABLED', 'false')
    await GET(new Request('http://localhost/api/v1/cron/jobs', AUTHORIZED))

    await GET(new Request('http://localhost/api/v1/cron/jobs'))

    expect(mocks.registerAllEventConsumers).not.toHaveBeenCalled()
    expect(mocks.processPendingBatch).not.toHaveBeenCalled()
  })
})
