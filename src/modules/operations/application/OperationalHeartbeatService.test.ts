import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  heartbeatUpsert: vi.fn(),
  heartbeatUpdate: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    operationalHeartbeat: {
      upsert: mocks.heartbeatUpsert,
      update: mocks.heartbeatUpdate,
    },
    $queryRaw: mocks.queryRaw,
  },
}))

import {
  OPERATIONAL_HEARTBEAT_ID,
  OperationalHeartbeatService,
  WORKER_CYCLE_FAILURE_CODE,
} from './OperationalHeartbeatService'

describe('OperationalHeartbeatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.heartbeatUpsert.mockResolvedValue({})
    mocks.heartbeatUpdate.mockResolvedValue({})
    mocks.queryRaw.mockResolvedValue([])
  })

  it('records start, success, and a stable failure code without identifiers', async () => {
    const startedAt = new Date('2026-07-30T12:00:00Z')
    const succeededAt = new Date('2026-07-30T12:00:10Z')
    await OperationalHeartbeatService.markStarted(startedAt)
    await OperationalHeartbeatService.markSucceeded(succeededAt)
    await OperationalHeartbeatService.markFailed()

    expect(mocks.heartbeatUpsert).toHaveBeenCalledWith({
      where: { id: OPERATIONAL_HEARTBEAT_ID },
      create: { id: OPERATIONAL_HEARTBEAT_ID, lastStartedAt: startedAt },
      update: { lastStartedAt: startedAt },
    })
    expect(mocks.heartbeatUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: OPERATIONAL_HEARTBEAT_ID },
      data: { lastSucceededAt: succeededAt, lastErrorCode: null },
    })
    expect(mocks.heartbeatUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: OPERATIONAL_HEARTBEAT_ID },
      data: { lastErrorCode: WORKER_CYCLE_FAILURE_CODE },
    })
  })

  it('deletes at most 100 processed Stripe inbox rows older than 90 days', async () => {
    mocks.queryRaw.mockResolvedValue(Array.from({ length: 100 }, (_, index) => ({ id: `event-${index}` })))
    await expect(OperationalHeartbeatService.pruneProcessedStripeWebhooks(
      new Date('2026-07-30T12:00:00Z'),
    )).resolves.toEqual({ processedStripeWebhooksDeleted: 100 })

    const [statement, cutoff, limit] = mocks.queryRaw.mock.calls[0]
    expect(statement.join(' ')).toContain('"status" = \'PROCESSED\'')
    expect(statement.join(' ')).toContain('FOR UPDATE SKIP LOCKED')
    expect(cutoff).toEqual(new Date('2026-05-01T12:00:00Z'))
    expect(limit).toBe(100)
  })
})
