import 'server-only'

import { randomUUID } from 'node:crypto'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { CrmDeliveryService } from '@/src/modules/leads/application/CrmDeliveryService'
import { ScanReconciliationService } from '@/src/modules/leads/application/ScanReconciliationService'
import { ScanRunService } from '@/src/modules/leads/application/ScanRunService'
import {
  ActiveKeywordLimitExceededError,
  ScanSchedulerService,
} from '@/src/modules/leads/application/ScanSchedulerService'
import {
  DurableJobRepository,
  type ClaimedDurableJob,
} from './DurableJobRepository'

const DEFAULT_WALL_TIME_MS = 40_000
const DEFAULT_BATCH_SIZE = 4

export function boundedBatchSize(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    return DEFAULT_BATCH_SIZE
  }

  return Math.min(25, Math.max(1, value))
}

export class WorkerPreparationError extends Error {
  constructor(
    readonly code:
      | 'SCAN_SCHEDULER_FAILED'
      | 'SCAN_RECONCILIATION_FAILED',
  ) {
    super(code)
    this.name = 'WorkerPreparationError'
  }
}

export type JobWorkerStopReason =
  | 'NO_JOBS'
  | 'BATCH_LIMIT_REACHED'
  | 'WALL_TIME_REACHED'

export type JobWorkerCycleReport = {
  ok: true
  workerId: string
  preparation: {
    scheduled: Awaited<
      ReturnType<typeof ScanSchedulerService.enqueueDueSchedules>
    >
    reconciled: Awaited<
      ReturnType<typeof ScanReconciliationService.reconcile>
    >
  }
  execution: {
    claimed: number
    processed: number
    isolatedFailures: number
  }
  stopReason: JobWorkerStopReason
  elapsedMs: number

  // Backward-compatible fields for current callers.
  scheduled: Awaited<
    ReturnType<typeof ScanSchedulerService.enqueueDueSchedules>
  >
  reconciled: Awaited<
    ReturnType<typeof ScanReconciliationService.reconcile>
  >
  claimed: number
  processed: number
  isolatedFailures: number
}

async function processOne(job: ClaimedDurableJob): Promise<void> {
  if (job.kind === 'TENANT_SCAN') {
    try {
      await ScanRunService.processClaimedJob(job)
    } catch (error) {
      logger.error({ err: error, jobId: job.id, kind: job.kind }, 'Job processing failed, invoking failure handler')
      await ScanRunService.handleClaimedJobFailure(job, error)
    }

    return
  }

  if (job.kind === 'CRM_EXPORT') {
    try {
      await CrmDeliveryService.processClaimedJob(job)
    } catch (error) {
      logger.error({ err: error, jobId: job.id, kind: job.kind }, 'Job processing failed, invoking failure handler')
      await CrmDeliveryService.handleClaimedJobFailure(job, error)
    }

    return
  }

  throw new Error(`Unsupported durable job kind: ${job.kind}`)
}

export class JobWorkerService {
  static async runCycle(options?: {
    batchSize?: number
    wallTimeMs?: number
    workerId?: string
  }): Promise<JobWorkerCycleReport> {
    const startedAt = Date.now()
    const wallTimeMs = Math.min(
      50_000,
      Math.max(
        1,
        options?.wallTimeMs ?? DEFAULT_WALL_TIME_MS,
      ),
    )
    const workerId =
      options?.workerId ?? `vercel-${randomUUID()}`

    const [scheduleResult, reconciliationResult] =
      await Promise.allSettled([
        ScanSchedulerService.enqueueDueSchedules(),
        ScanReconciliationService.reconcile(),
      ])

    if (scheduleResult.status === 'rejected') {
      const outcomeCode =
        scheduleResult.reason instanceof
        ActiveKeywordLimitExceededError
          ? 'ACTIVE_KEYWORD_LIMIT_EXCEEDED'
          : 'SCAN_SCHEDULER_FAILED'

      logger.error(
        { outcomeCode },
        'Scan scheduler step failed',
      )
    }

    if (reconciliationResult.status === 'rejected') {
      logger.error(
        {
          outcomeCode:
            'SCAN_RECONCILIATION_FAILED',
        },
        'Scan reconciliation step failed',
      )
    }

    if (scheduleResult.status === 'rejected') {
      if (
        scheduleResult.reason instanceof
        ActiveKeywordLimitExceededError
      ) {
        throw scheduleResult.reason
      }

      throw new WorkerPreparationError(
        'SCAN_SCHEDULER_FAILED',
      )
    }

    if (reconciliationResult.status === 'rejected') {
      throw new WorkerPreparationError(
        'SCAN_RECONCILIATION_FAILED',
      )
    }

    const scheduled = scheduleResult.value
    const reconciled = reconciliationResult.value
    const batchSize = boundedBatchSize(
      options?.batchSize,
    )

    let claimed = 0
    let processed = 0
    let isolatedFailures = 0
    let stopReason: JobWorkerStopReason = 'NO_JOBS'

    while (claimed < batchSize) {
      if (
        claimed > 0 &&
        Date.now() - startedAt >= wallTimeMs
      ) {
        stopReason = 'WALL_TIME_REACHED'
        break
      }

      const [job] = await DurableJobRepository.claimBatch({
        workerId,
        batchSize: 1,
      })

      if (!job) {
        stopReason = 'NO_JOBS'
        break
      }

      claimed += 1

      /*
       * The job is already leased. It must be processed before evaluating
       * the cycle's batch or wall-time stopping conditions.
       */
      try {
        await processOne(job)
      } catch (error) {
        isolatedFailures += 1

        logger.error(
          {
            err: error,
            jobId: job.id,
            kind: job.kind,
          },
          'Durable job failure handler failed',
        )
      } finally {
        processed += 1
      }

      if (claimed >= batchSize) {
        stopReason = 'BATCH_LIMIT_REACHED'
        break
      }

      if (Date.now() - startedAt >= wallTimeMs) {
        stopReason = 'WALL_TIME_REACHED'
        break
      }
    }

    const execution = {
      claimed,
      processed,
      isolatedFailures,
    }

    const report: JobWorkerCycleReport = {
      ok: true,
      workerId,
      preparation: {
        scheduled,
        reconciled,
      },
      execution,
      stopReason,
      elapsedMs: Date.now() - startedAt,

      // Backward-compatible shape.
      scheduled,
      reconciled,
      claimed,
      processed,
      isolatedFailures,
    }

    logger.info(
      {
        event: 'job_worker_cycle_completed',
        outcomeCode: 'JOB_WORKER_CYCLE_COMPLETED',
        workerId,
        preparation: report.preparation,
        execution,
        stopReason,
        elapsedMs: report.elapsedMs,
      },
      'Job worker cycle completed',
    )

    return report
  }
}
