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

import { GET } from './route'

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
})
