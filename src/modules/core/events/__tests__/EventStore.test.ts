import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
  queryRaw: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    domainEventLog: {
      create: mocks.create,
      update: mocks.update,
      findUnique: mocks.findUnique,
    },
    $transaction: mocks.transaction,
    $queryRaw: mocks.queryRaw,
  },
}))

import { EventFactory } from '../EventFactory'
import { EventStore, calculateAvailableAt } from '../EventStore'

describe('EventStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(async (cb: (tx: { $queryRaw: typeof mocks.queryRaw }) => unknown) =>
      cb({ $queryRaw: mocks.queryRaw })
    )
  })

  it('calculates exponential backoff correctly', () => {
    const t1 = calculateAvailableAt(1)
    const t2 = calculateAvailableAt(2)
    expect(t2.getTime()).toBeGreaterThan(t1.getTime())
  })

  it('persists events to the outbox in PENDING state', async () => {
    const event = EventFactory.create({
      type: 'opportunity.discovered',
      version: 1,
      actorId: 'user_test',
      source: 'test_source',
      payload: {
        opportunityId: 'opp_test',
        leadId: 'lead_test',
        userId: 'user_test',
        keywordId: 'kw_test',
        keywordPhrase: 'test phrase',
        platform: 'reddit',
        externalPostId: 'ext_test',
        author: 'test_author',
        content: 'test content',
        url: 'https://reddit.com/r/test/123',
      },
    })

    mocks.create.mockResolvedValue({
      id: 'log_123',
      eventId: event.id,
      status: 'PENDING',
      attempts: 0,
    })

    const record = await EventStore.writeOutbox(event)

    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(record.status).toBe('PENDING')
  })

  it('claims pending outbox events using queryRaw with SKIP LOCKED', async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([{ id: 'log_123' }])
      .mockResolvedValueOnce([
        {
          id: 'log_123',
          eventId: 'evt_123',
          type: 'opportunity.discovered',
          status: 'PROCESSING',
          attempts: 1,
        },
      ])

    const claimedBatch = await EventStore.claimPendingBatch(10)

    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(claimedBatch).toHaveLength(1)
    expect(claimedBatch[0].status).toBe('PROCESSING')
  })
})
