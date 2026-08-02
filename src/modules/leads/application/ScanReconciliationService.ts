import 'server-only'

import prisma from '@/lib/prisma'
import { logger } from '@/src/modules/core/infrastructure/logger'
import {
  incrementFailed,
  incrementRefunded,
  initialScanReconciliationSummary,
  type ScanReconciliationSummary,
} from '@/src/modules/leads/domain/reconciliation'
import { ScanRunService } from './ScanRunService'

const STALE_AFTER_MS = 30 * 60_000

type Candidate = { id: string; errorCode: string }

export class ScanReconciliationService {
  static async reconcile(batchSize = 20): Promise<ScanReconciliationSummary> {
    const boundedBatchSize = Number.isSafeInteger(batchSize)
      ? Math.min(50, Math.max(1, batchSize))
      : 20

    const candidates = await prisma.$queryRaw<Candidate[]>`
      SELECT
        run."id",
        CASE
          WHEN job."status" = 'DEAD' THEN COALESCE(job."lastErrorCode", 'DEAD_JOB_RECONCILED')
          ELSE 'STRANDED_SCAN_RECONCILED'
        END AS "errorCode"
      FROM "ScanRun" AS run
      LEFT JOIN "DurableJob" AS job ON job."scanRunId" = run."id"
      WHERE run."status" IN ('QUEUED', 'RUNNING')
        AND (
          job."status" IN ('DEAD', 'CANCELLED', 'SUCCEEDED')
          OR (
            job."id" IS NULL
            AND run."createdAt" <= clock_timestamp() - (${STALE_AFTER_MS} * INTERVAL '1 millisecond')
          )
        )
      ORDER BY run."createdAt", run."id"
      LIMIT ${boundedBatchSize}
    `

    const summary = initialScanReconciliationSummary()
    summary.candidates = candidates.length

    for (const candidate of candidates) {
      try {
        const didRefund = await prisma.$transaction((tx) =>
          ScanRunService.refundScanInTransaction(tx, candidate.id, candidate.errorCode),
        )

        if (didRefund) {
          incrementRefunded(summary, {
            runId: candidate.id,
            errorCode: candidate.errorCode,
            outcome: 'REFUND_SUCCEEDED',
          })
        } else {
          incrementFailed(summary, {
            runId: candidate.id,
            errorCode: candidate.errorCode,
            outcome: 'REFUND_SKIPPED',
          })
        }
      } catch {
        incrementFailed(summary, {
          runId: candidate.id,
          errorCode: candidate.errorCode,
          outcome: 'REFUND_FAILED',
        })
        logger.error(
          {
            outcomeCode: 'SCAN_RECONCILIATION_ITEM_FAILED',
            runId: candidate.id,
            errorCode: candidate.errorCode,
          },
          'Scan reconciliation item failed',
        )
      }
    }

    return summary
  }
}
