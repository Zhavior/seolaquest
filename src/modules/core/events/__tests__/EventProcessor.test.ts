import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findUniqueReceipt: vi.fn(),
  upsertReceipt: vi.fn(),
  findUniqueLog: vi.fn(),
  updateLog: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    domainEventConsumerReceipt: {
      findUnique: mocks.findUniqueReceipt,
      upsert: mocks.upsertReceipt,
    },
    domainEventLog: {
      findUnique: mocks.findUniqueLog,
      update: mocks.updateLog,
    },
  },
}))

import { EventFactory } from '../EventFactory'
import { EventRegistry, OpportunityEngagedPayloadSchema } from '../EventRegistry'
import { EventDispatcher } from '../EventDispatcher'
import { EventProcessor } from '../EventProcessor'
import type { DomainEventLog } from '@prisma/client'

function buildLogRecord(overrides: Partial<DomainEventLog> = {}): DomainEventLog {
  const event = EventFactory.create({
    type: 'opportunity.engaged',
    version: 1,
    actorId: 'user_proc',
    source: 'test',
    payload: {
      opportunityId: 'opp_proc',
      leadId: 'lead_proc',
      actionTaken: 'CLAIMED',
      engagedAt: new Date().toISOString(),
    },
  })

  return {
    id: 'db_id_generated',
    eventId: event.id,
    type: event.type,
    version: event.version,
    actorId: event.actorId,
    source: event.source,
    correlationId: event.correlationId,
    causationId: null,
    idempotencyKey: event.idempotencyKey,
    payload: event.payload,
    metadata: null,
    status: 'PROCESSING',
    attempts: 1,
    maxAttempts: 5,
    availableAt: new Date(),
    lockedAt: null,
    lastErrorCode: null,
    occurredAt: new Date(),
    processedAt: null,
    createdAt: new Date(),
    ...overrides,
  } as DomainEventLog
}

describe('EventProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    EventDispatcher.clearAll()
  })

  it('processes events and creates consumer receipts', async () => {
    EventRegistry.register({
      type: 'opportunity.engaged',
      version: 1,
      schema: OpportunityEngagedPayloadSchema,
    })

    const handlerFn = vi.fn().mockResolvedValue(undefined)
    EventDispatcher.register('opportunity.engaged', 'test.consumer.a', handlerFn)

    const event = EventFactory.create({
      type: 'opportunity.engaged',
      version: 1,
      actorId: 'user_proc',
      source: 'test',
      payload: {
        opportunityId: 'opp_proc',
        leadId: 'lead_proc',
        actionTaken: 'CLAIMED',
        engagedAt: new Date().toISOString(),
      },
    })

    const logRecord: DomainEventLog = {
      id: 'db_id_1',
      eventId: event.id,
      type: event.type,
      version: event.version,
      actorId: event.actorId,
      source: event.source,
      correlationId: event.correlationId,
      causationId: null,
      idempotencyKey: event.idempotencyKey,
      payload: event.payload,
      metadata: null,
      status: 'PROCESSING',
      attempts: 1,
      maxAttempts: 5,
      availableAt: new Date(),
      lockedAt: null,
      lastErrorCode: null,
      occurredAt: new Date(),
      processedAt: null,
      createdAt: new Date(),
    }

    mocks.findUniqueReceipt.mockResolvedValue(null)
    mocks.upsertReceipt.mockResolvedValue({ id: 'rcpt_1', status: 'PROCESSED' })
    mocks.updateLog.mockResolvedValue({ ...logRecord, status: 'PROCESSED' })

    const success = await EventProcessor.processEvent(logRecord)

    expect(success).toBe(true)
    expect(handlerFn).toHaveBeenCalledTimes(1)
    expect(mocks.upsertReceipt).toHaveBeenCalledTimes(1)
    expect(mocks.updateLog).toHaveBeenCalledWith({
      where: { eventId: event.id },
      data: expect.objectContaining({ status: 'PROCESSED' }),
    })
  })

  it('skips already processed consumer receipts on retries', async () => {
    EventRegistry.register({
      type: 'opportunity.engaged',
      version: 1,
      schema: OpportunityEngagedPayloadSchema,
    })

    const handlerA = vi.fn().mockResolvedValue(undefined)
    const handlerB = vi.fn().mockRejectedValue(new Error('Transient consumer B error'))

    EventDispatcher.register('opportunity.engaged', 'consumer.a', handlerA)
    EventDispatcher.register('opportunity.engaged', 'consumer.b', handlerB)

    const event = EventFactory.create({
      type: 'opportunity.engaged',
      version: 1,
      actorId: 'user_proc',
      source: 'test',
      payload: {
        opportunityId: 'opp_proc',
        leadId: 'lead_proc',
        actionTaken: 'CLAIMED',
        engagedAt: new Date().toISOString(),
      },
    })

    const logRecord: DomainEventLog = {
      id: 'db_id_2',
      eventId: event.id,
      type: event.type,
      version: event.version,
      actorId: event.actorId,
      source: event.source,
      correlationId: event.correlationId,
      causationId: null,
      idempotencyKey: event.idempotencyKey,
      payload: event.payload,
      metadata: null,
      status: 'PROCESSING',
      attempts: 1,
      maxAttempts: 5,
      availableAt: new Date(),
      lockedAt: null,
      lastErrorCode: null,
      occurredAt: new Date(),
      processedAt: null,
      createdAt: new Date(),
    }

    // Consumer A is ALREADY PROCESSED, Consumer B is null
    mocks.findUniqueReceipt.mockImplementation(async ({ where }: { where: { eventId_consumerKey: { consumerKey: string } } }) => {
      if (where.eventId_consumerKey.consumerKey === 'consumer.a') {
        return { id: 'rcpt_a', status: 'PROCESSED', attemptCount: 1 }
      }
      return null
    })

    mocks.upsertReceipt.mockResolvedValue({ id: 'rcpt_b', status: 'FAILED' })

    const result = await EventProcessor.processEvent(logRecord)

    expect(result).toBe(false)
    // Consumer A must NOT have been called (skips already processed receipt)
    expect(handlerA).not.toHaveBeenCalled()
    // Consumer B was called and failed
    expect(handlerB).toHaveBeenCalledTimes(1)
  })

  it('schedules a retry instead of marking PROCESSED when a consumer fails', async () => {
    EventRegistry.register({
      type: 'opportunity.engaged',
      version: 1,
      schema: OpportunityEngagedPayloadSchema,
    })

    const failing = vi.fn().mockRejectedValue(new Error('downstream unavailable'))
    EventDispatcher.register('opportunity.engaged', 'consumer.retryable', failing)

    const logRecord = buildLogRecord({ id: 'db_id_retry', attempts: 1, maxAttempts: 5 })

    mocks.findUniqueReceipt.mockResolvedValue(null)
    mocks.upsertReceipt.mockResolvedValue({ id: 'rcpt_retry', status: 'FAILED' })
    mocks.updateLog.mockResolvedValue(logRecord)

    const result = await EventProcessor.processEvent(logRecord)

    expect(result).toBe(false)
    expect(failing).toHaveBeenCalledTimes(1)

    // The outbox row must be handed back for another attempt, never marked PROCESSED.
    expect(mocks.updateLog).toHaveBeenCalledTimes(1)
    expect(mocks.updateLog).toHaveBeenCalledWith({
      where: { eventId: logRecord.eventId },
      data: expect.objectContaining({
        status: 'PENDING',
        lockedAt: null,
        availableAt: expect.any(Date),
        lastErrorCode: 'downstream unavailable',
      }),
    })
    const [{ data }] = mocks.updateLog.mock.calls[0] as [{ data: { status: string } }]
    expect(data.status).not.toBe('PROCESSED')
  })

  it('dead-letters the event once the attempt budget is exhausted', async () => {
    EventRegistry.register({
      type: 'opportunity.engaged',
      version: 1,
      schema: OpportunityEngagedPayloadSchema,
    })

    EventDispatcher.register(
      'opportunity.engaged',
      'consumer.exhausted',
      vi.fn().mockRejectedValue(new Error('still broken')),
    )

    const logRecord = buildLogRecord({ id: 'db_id_dead', attempts: 5, maxAttempts: 5 })

    mocks.findUniqueReceipt.mockResolvedValue(null)
    mocks.upsertReceipt.mockResolvedValue({ id: 'rcpt_dead', status: 'FAILED' })
    mocks.updateLog.mockResolvedValue(logRecord)

    await EventProcessor.processEvent(logRecord)

    expect(mocks.updateLog).toHaveBeenCalledWith({
      where: { eventId: logRecord.eventId },
      data: expect.objectContaining({ status: 'FAILED' }),
    })
  })

  it('marks an event PROCESSED with no side effects when its type has no consumers', async () => {
    // This is the destructive branch the cron drain must never reach: it is exactly
    // why consumer registration has to run before the outbox is claimed.
    const logRecord = buildLogRecord({ id: 'db_id_orphan', attempts: 1, maxAttempts: 5 })
    mocks.updateLog.mockResolvedValue(logRecord)

    const result = await EventProcessor.processEvent(logRecord)

    expect(result).toBe(true)
    expect(mocks.upsertReceipt).not.toHaveBeenCalled()
    expect(mocks.updateLog).toHaveBeenCalledWith({
      where: { eventId: logRecord.eventId },
      data: expect.objectContaining({ status: 'PROCESSED' }),
    })
  })
})
