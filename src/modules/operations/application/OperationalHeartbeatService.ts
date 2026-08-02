import 'server-only'

import prisma from '@/lib/prisma'

export const OPERATIONAL_HEARTBEAT_ID = 'durable-worker'
export const WORKER_CYCLE_FAILURE_CODE = 'WORKER_CYCLE_FAILED'

const STRIPE_WEBHOOK_RETENTION_MS = 90 * 24 * 60 * 60 * 1000
const STRIPE_WEBHOOK_DELETE_LIMIT = 100

export class OperationalHeartbeatService {
  static async markStarted(now = new Date()) {
    await prisma.operationalHeartbeat.upsert({
      where: { id: OPERATIONAL_HEARTBEAT_ID },
      create: {
        id: OPERATIONAL_HEARTBEAT_ID,
        lastStartedAt: now,
      },
      update: { lastStartedAt: now },
    })
  }

  static async markSucceeded(now = new Date()) {
    await prisma.operationalHeartbeat.update({
      where: { id: OPERATIONAL_HEARTBEAT_ID },
      data: {
        lastSucceededAt: now,
        lastErrorCode: null,
      },
    })
  }

  static async markFailed(
    errorCode: typeof WORKER_CYCLE_FAILURE_CODE = WORKER_CYCLE_FAILURE_CODE,
  ) {
    await prisma.operationalHeartbeat.update({
      where: { id: OPERATIONAL_HEARTBEAT_ID },
      data: { lastErrorCode: errorCode },
    })
  }

  /**
   * Bounds privacy retention work so maintenance cannot monopolize a cron run.
   * The status predicate deliberately preserves failed and in-flight events.
   */
  static async pruneProcessedStripeWebhooks(now = new Date()) {
    const retentionCutoff = new Date(now.getTime() - STRIPE_WEBHOOK_RETENTION_MS)
    const deleted = await prisma.$queryRaw<Array<{ id: string }>>`
      WITH expired AS (
        SELECT "id"
        FROM "ProcessedWebhook"
        WHERE "status" = 'PROCESSED'
          AND "processedAt" < ${retentionCutoff}
        ORDER BY "processedAt", "id"
        LIMIT ${STRIPE_WEBHOOK_DELETE_LIMIT}
        FOR UPDATE SKIP LOCKED
      )
      DELETE FROM "ProcessedWebhook" AS event
      USING expired
      WHERE event."id" = expired."id"
      RETURNING event."id"
    `
    return { processedStripeWebhooksDeleted: deleted.length }
  }
}
