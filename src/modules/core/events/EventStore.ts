import 'server-only'
import { Prisma, type DomainEventLog } from '@prisma/client'
import prisma from '@/lib/prisma'
import { DomainEvent } from './DomainEvent'

export type TransactionClient = Prisma.TransactionClient

const DEFAULT_BATCH_SIZE = 10
const RETRY_BASE_MS = 2_000
const RETRY_CAP_MS = 15 * 60_000
const LEASE_DURATION_MS = 5 * 60_000

export function calculateAvailableAt(attempts: number): Date {
  const exponent = Math.max(0, Math.min(attempts - 1, 10))
  const delayMs = Math.min(RETRY_CAP_MS, RETRY_BASE_MS * (2 ** exponent))
  return new Date(Date.now() + delayMs)
}

export class EventStore {
  /**
   * Transactionally persists a DomainEvent into the DomainEventLog outbox in 'PENDING' state.
   * MUST be executed inside the same transaction as domain entity mutations.
   */
  static async writeOutbox(
    event: DomainEvent,
    db: TransactionClient | typeof prisma = prisma
  ): Promise<DomainEventLog> {
    return db.domainEventLog.create({
      data: {
        eventId: event.id,
        type: event.type,
        version: event.version,
        actorId: event.actorId,
        source: event.source,
        correlationId: event.correlationId,
        causationId: event.causationId ?? null,
        idempotencyKey: event.idempotencyKey,
        payload: event.payload as Prisma.InputJsonValue,
        metadata: event.metadata ? (event.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 5,
        availableAt: new Date(),
        occurredAt: new Date(event.occurredAt),
      },
    })
  }

  /**
   * Claims ready PENDING or retryable FAILED outbox events for processing.
   * Uses SKIP LOCKED concurrency so parallel workers do not block each other.
   */
  static async claimPendingBatch(
    batchSize = DEFAULT_BATCH_SIZE
  ): Promise<DomainEventLog[]> {
    const limit = Math.min(Math.max(batchSize, 1), 50)
    const staleCutoff = new Date(Date.now() - LEASE_DURATION_MS)

    return prisma.$transaction(async (tx) => {
      const candidates = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "DomainEventLog"
        WHERE (
            "status" = 'PENDING'
            OR "status" = 'FAILED'
            OR ("status" = 'PROCESSING' AND "lockedAt" < ${staleCutoff})
          )
          AND "attempts" < "maxAttempts"
          AND "availableAt" <= clock_timestamp()
        ORDER BY "availableAt" ASC, "createdAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      `

      if (candidates.length === 0) return []

      const ids = candidates.map((c) => c.id)

      const claimed = await tx.$queryRaw<DomainEventLog[]>`
        UPDATE "DomainEventLog"
        SET
          "status" = 'PROCESSING',
          "lockedAt" = clock_timestamp(),
          "attempts" = "attempts" + 1
        WHERE "id" IN (${Prisma.join(ids)})
        RETURNING *
      `

      return claimed
    })
  }

  /**
   * Marks an outbox event as PROCESSED.
   */
  static async markProcessed(eventId: string, db: TransactionClient | typeof prisma = prisma): Promise<void> {
    await db.domainEventLog.update({
      where: { eventId },
      data: {
        status: 'PROCESSED',
        lockedAt: null,
        processedAt: new Date(),
      },
    })
  }

  /**
   * Schedules a retry for an outbox event with exponential backoff using availableAt.
   */
  static async scheduleRetry(
    eventId: string,
    attempts: number,
    errorCode: string,
    db: TransactionClient | typeof prisma = prisma
  ): Promise<void> {
    const availableAt = calculateAvailableAt(attempts)
    await db.domainEventLog.update({
      where: { eventId },
      data: {
        status: 'PENDING',
        lockedAt: null,
        availableAt,
        lastErrorCode: errorCode.slice(0, 255),
      },
    })
  }

  /**
   * Marks an outbox event as permanently FAILED when max attempts are exceeded.
   */
  static async markFailed(
    eventId: string,
    errorCode: string,
    db: TransactionClient | typeof prisma = prisma
  ): Promise<void> {
    await db.domainEventLog.update({
      where: { eventId },
      data: {
        status: 'FAILED',
        lockedAt: null,
        lastErrorCode: errorCode.slice(0, 255),
      },
    })
  }
}
