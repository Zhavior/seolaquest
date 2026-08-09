import 'server-only'
import type { DomainEventLog } from '@prisma/client'
import prisma from '@/lib/prisma'
import { DomainEvent } from './DomainEvent'
import { EventDispatcher } from './EventDispatcher'
import { EventStore } from './EventStore'
import { logger } from '@/src/modules/core/infrastructure/logger'

export interface ProcessBatchResult {
  claimedCount: number
  processedCount: number
  failedCount: number
}

function toDomainEvent(log: DomainEventLog): DomainEvent {
  return {
    id: log.eventId,
    type: log.type,
    version: log.version,
    actorId: log.actorId,
    source: log.source,
    correlationId: log.correlationId,
    causationId: log.causationId ?? undefined,
    idempotencyKey: log.idempotencyKey,
    payload: log.payload as Record<string, unknown>,
    metadata: log.metadata ? (log.metadata as Record<string, unknown>) : undefined,
    occurredAt: log.occurredAt.toISOString(),
  }
}

export class EventProcessor {
  /**
   * Processes a single committed outbox event across all registered consumers.
   * Enforces consumer-level idempotency receipts via DomainEventConsumerReceipt.
   */
  static async processEvent(log: DomainEventLog): Promise<boolean> {
    const event = toDomainEvent(log)
    const consumers = EventDispatcher.getConsumers(event.type)

    if (consumers.length === 0) {
      // No consumers registered for this event type; mark as processed cleanly.
      await EventStore.markProcessed(log.eventId)
      return true
    }

    let allSucceeded = true
    let lastConsumerError = ''

    for (const { consumerKey, handler } of consumers) {
      // Check existing consumer receipt
      const existingReceipt = await prisma.domainEventConsumerReceipt.findUnique({
        where: {
          eventId_consumerKey: {
            eventId: log.eventId,
            consumerKey,
          },
        },
      })

      if (existingReceipt?.status === 'PROCESSED') {
        logger.info(
          { eventId: log.eventId, consumerKey, outcomeCode: 'EVENT_CONSUMER_ALREADY_PROCESSED' },
          `Consumer '${consumerKey}' already completed for event '${log.eventId}'; skipping.`
        )
        continue
      }

      const attemptCount = (existingReceipt?.attemptCount ?? 0) + 1

      try {
        await handler(event)

        // Record successful receipt
        await prisma.domainEventConsumerReceipt.upsert({
          where: {
            eventId_consumerKey: {
              eventId: log.eventId,
              consumerKey,
            },
          },
          create: {
            eventId: log.eventId,
            consumerKey,
            status: 'PROCESSED',
            attemptCount,
            processedAt: new Date(),
            lastAttemptAt: new Date(),
          },
          update: {
            status: 'PROCESSED',
            attemptCount,
            processedAt: new Date(),
            lastAttemptAt: new Date(),
            lastError: null,
          },
        })

        logger.info(
          { eventId: log.eventId, consumerKey, outcomeCode: 'EVENT_CONSUMER_SUCCESS' },
          `Consumer '${consumerKey}' processed event '${log.eventId}' successfully.`
        )
      } catch (err: unknown) {
        allSucceeded = false
        const errorMessage = err instanceof Error ? err.message : String(err)
        lastConsumerError = errorMessage

        logger.error(
          { err, eventId: log.eventId, consumerKey, attemptCount, outcomeCode: 'EVENT_CONSUMER_FAILED' },
          `Consumer '${consumerKey}' failed for event '${log.eventId}': ${errorMessage}`
        )

        // Record failed receipt
        await prisma.domainEventConsumerReceipt.upsert({
          where: {
            eventId_consumerKey: {
              eventId: log.eventId,
              consumerKey,
            },
          },
          create: {
            eventId: log.eventId,
            consumerKey,
            status: 'FAILED',
            attemptCount,
            lastError: errorMessage.slice(0, 500),
            lastAttemptAt: new Date(),
          },
          update: {
            status: 'FAILED',
            attemptCount,
            lastError: errorMessage.slice(0, 500),
            lastAttemptAt: new Date(),
          },
        })
      }
    }

    if (allSucceeded) {
      await EventStore.markProcessed(log.eventId)
    } else {
      if (log.attempts >= log.maxAttempts) {
        await EventStore.markFailed(log.eventId, lastConsumerError || 'Consumer processing failed')
      } else {
        await EventStore.scheduleRetry(log.eventId, log.attempts, lastConsumerError || 'Consumer processing failed')
      }
    }

    return allSucceeded
  }

  /**
   * Claims and processes a batch of committed outbox events.
   */
  static async processPendingBatch(batchSize = 10): Promise<ProcessBatchResult> {
    const claimedLogs = await EventStore.claimPendingBatch(batchSize)
    if (claimedLogs.length === 0) {
      return { claimedCount: 0, processedCount: 0, failedCount: 0 }
    }

    let processedCount = 0
    let failedCount = 0

    for (const log of claimedLogs) {
      const success = await this.processEvent(log)
      if (success) {
        processedCount += 1
      } else {
        failedCount += 1
      }
    }

    return {
      claimedCount: claimedLogs.length,
      processedCount,
      failedCount,
    }
  }
}
