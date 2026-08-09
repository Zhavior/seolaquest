import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import { EventStore } from '../EventStore'

// Same gate the other real-PostgreSQL suites use (Phase45, DeletionBillingRace,
// CreditService). Without it this file ran unconditionally in `npm test`, where
// no DATABASE_URL is loaded, so it failed on every default run — and a suite
// that always fails is a suite nobody reads.
//
// Run it with `npm run test:integration`, which loads .env.local and sets this.
const integrationEnabled = process.env.EVENT_CORE_INTEGRATION_TEST === 'true'

describe.skipIf(!integrationEnabled)('EventStore Integration (Lease & Recovery)', () => {
  beforeAll(async () => {
    // Clean up any existing outbox items to ensure a clean slate
    await prisma.domainEventLog.deleteMany({})
  })

  afterAll(async () => {
    await prisma.domainEventLog.deleteMany({})
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.domainEventLog.deleteMany({})
  })

  it('1. normal PROCESSING event is not stolen while lease is valid', async () => {
    // Create an event that is currently PROCESSING but lease is still valid (locked 1 min ago)
    const activeLeaseTime = new Date(Date.now() - 1 * 60_000)

    await prisma.domainEventLog.create({
      data: {
        eventId: 'test_active_lease',
        type: 'test.event',
        actorId: 'system',
        source: 'test',
        correlationId: '123',
        idempotencyKey: 'test_active_lease_idemp',
        payload: { test: true },
        status: 'PROCESSING',
        lockedAt: activeLeaseTime,
        attempts: 1,
        occurredAt: new Date(),
      }
    })

    // Try to claim
    const claimed = await EventStore.claimPendingBatch(10)

    // Should NOT claim the event because its lease is valid
    expect(claimed).toHaveLength(0)
  })

  it('2. stale PROCESSING event becomes recoverable', async () => {
    // Create an event that is PROCESSING but lease is expired (locked 6 mins ago)
    const staleLeaseTime = new Date(Date.now() - 6 * 60_000)

    await prisma.domainEventLog.create({
      data: {
        eventId: 'test_stale_lease',
        type: 'test.event',
        actorId: 'system',
        source: 'test',
        correlationId: '123',
        idempotencyKey: 'test_stale_lease_idemp',
        payload: { test: true },
        status: 'PROCESSING',
        lockedAt: staleLeaseTime,
        attempts: 1,
        occurredAt: new Date(),
      }
    })

    // Try to claim
    const claimed = await EventStore.claimPendingBatch(10)

    // Should claim the event because its lease expired
    expect(claimed).toHaveLength(1)
    expect(claimed[0].eventId).toBe('test_stale_lease')
  })

  it('3. recovered event increments attempts correctly', async () => {
    const staleLeaseTime = new Date(Date.now() - 6 * 60_000)

    await prisma.domainEventLog.create({
      data: {
        eventId: 'test_attempts',
        type: 'test.event',
        actorId: 'system',
        source: 'test',
        correlationId: '123',
        idempotencyKey: 'test_attempts_idemp',
        payload: { test: true },
        status: 'PROCESSING',
        lockedAt: staleLeaseTime,
        attempts: 2, // Already attempted twice
        occurredAt: new Date(),
      }
    })

    const claimed = await EventStore.claimPendingBatch(10)

    expect(claimed).toHaveLength(1)
    expect(claimed[0].attempts).toBe(3) // Increment to 3
    expect(claimed[0].status).toBe('PROCESSING')
    // lockedAt should be updated to a newer timestamp, larger than staleLeaseTime
    expect(claimed[0].lockedAt?.getTime()).toBeGreaterThan(staleLeaseTime.getTime())
  })

  it('4. maxAttempts still prevents infinite retry', async () => {
    const staleLeaseTime = new Date(Date.now() - 6 * 60_000)

    await prisma.domainEventLog.create({
      data: {
        eventId: 'test_max_attempts',
        type: 'test.event',
        actorId: 'system',
        source: 'test',
        correlationId: '123',
        idempotencyKey: 'test_max_attempts_idemp',
        payload: { test: true },
        status: 'PROCESSING',
        lockedAt: staleLeaseTime,
        attempts: 5, // Reached max attempts
        maxAttempts: 5,
        occurredAt: new Date(),
      }
    })

    const claimed = await EventStore.claimPendingBatch(10)

    // Should NOT claim because it reached maxAttempts
    expect(claimed).toHaveLength(0)
  })

  it('5. two workers cannot recover the same stale event simultaneously (SKIP LOCKED)', async () => {
    const staleLeaseTime = new Date(Date.now() - 6 * 60_000)

    await prisma.domainEventLog.create({
      data: {
        eventId: 'test_concurrency',
        type: 'test.event',
        actorId: 'system',
        source: 'test',
        correlationId: '123',
        idempotencyKey: 'test_concurrency_idemp',
        payload: { test: true },
        status: 'PROCESSING',
        lockedAt: staleLeaseTime,
        attempts: 1,
        occurredAt: new Date(),
      }
    })

    // We simulate two concurrent workers trying to claim.
    // However, in a unit test we can just start a transaction manually that holds the lock,
    // and then try to claimPendingBatch in another connection to see it returns 0.
    // Or we can literally just run claimPendingBatch() concurrently in a Promise.all()
    // and assert that only one of them gets the event!

    const [batch1, batch2] = await Promise.all([
      EventStore.claimPendingBatch(10),
      EventStore.claimPendingBatch(10)
    ])

    // Only one worker should successfully claim the event
    const totalClaimed = batch1.length + batch2.length
    expect(totalClaimed).toBe(1)
  })
})
