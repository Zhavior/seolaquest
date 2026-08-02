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
import { DurableJobRepository, type ClaimedDurableJob } from './DurableJobRepository'

const DEFAULT_WALL_TIME_MS = 40_000
const DEFAULT_BATCH_SIZE = 4

function boundedBatchSize(value: number | undefined) {
  if (!Number.isSafeInteger(value)) return DEFAULT_BATCH_SIZE
  return Math.min(25, Math.max(1, value!))
}

export class WorkerPreparationError extends Error {
  constructor(readonly code: 'SCAN_SCHEDULER_FAILED' | 'SCAN_RECONCILIATION_FAILED') {
    super(code)
    this.name = 'WorkerPreparationError'
  }
}

async function processOne(job: ClaimedDurableJob) {
  if (job.kind === 'TENANT_SCAN') {
    try {
      await ScanRunService.processClaimedJob(job)
    } catch (error) {
      await ScanRunService.handleClaimedJobFailure(job, error)
    }
    return
  }

  if (job.kind === 'CRM_EXPORT') {
    try {
      await CrmDeliveryService.processClaimedJob(job)
    } catch (error) {
      await CrmDeliveryService.handleClaimedJobFailure(job, error)
    }
    return
  }

  // Database constraints reject unknown kinds. Throwing keeps this fail-closed
  // if an unsupported value is introduced without a worker implementation.
  throw new Error('Unsupported durable job kind')
}

export class JobWorkerService {
  static async runCycle(options?: { batchSize?: number; wallTimeMs?: number; workerId?: string }) {
    const startedAt = Date.now()
    const wallTimeMs = Math.min(50_000, Math.max(5_000, options?.wallTimeMs ?? DEFAULT_WALL_TIME_MS))
    const workerId = options?.workerId ?? `vercel-${randomUUID()}`

    const [scheduleResult, reconciliationResult] = await Promise.allSettled([
      ScanSchedulerService.enqueueDueSchedules(),
      ScanReconciliationService.reconcile(),
    ])
    if (scheduleResult.status === 'rejected') {
      const outcomeCode = scheduleResult.reason instanceof ActiveKeywordLimitExceededError
        ? 'ACTIVE_KEYWORD_LIMIT_EXCEEDED'
        : 'SCAN_SCHEDULER_FAILED'
      logger.error({ outcomeCode }, 'Scan scheduler step failed')
    }
    if (reconciliationResult.status === 'rejected') {
      logger.error({ outcomeCode: 'SCAN_RECONCILIATION_FAILED' }, 'Scan reconciliation step failed')
    }
    // Preparation is part of the cycle's truth contract. A partial failure
    // must reach the cron boundary so its heartbeat cannot be marked healthy.
    if (scheduleResult.status === 'rejected') {
      if (scheduleResult.reason instanceof ActiveKeywordLimitExceededError) {
        throw scheduleResult.reason
      }
      throw new WorkerPreparationError('SCAN_SCHEDULER_FAILED')
    }
    if (reconciliationResult.status === 'rejected') {
      throw new WorkerPreparationError('SCAN_RECONCILIATION_FAILED')
    }
    const scheduled = scheduleResult.value
    const reconciled = reconciliationResult.value

    const batchSize = boundedBatchSize(options?.batchSize)
    let claimed = 0
    let processed = 0
    let isolatedFailures = 0
    while (claimed < batchSize) {
      if (Date.now() - startedAt >= wallTimeMs) break
      // Claim only work that this invocation is ready to start. Claiming a
      // whole batch before checking the wall-time budget can consume attempts
      // for jobs that never execute when the serverless invocation ends.
      const [job] = await DurableJobRepository.claimBatch({
        workerId,
        batchSize: 1,
      })
      if (!job) break
      claimed += 1
      try {
        await processOne(job)
      } catch (error) {
        isolatedFailures += 1
        logger.error({ err: error, jobId: job.id, kind: job.kind }, 'Durable job failure handler failed')
      }
      processed += 1
    }

    return {
      ok: true,
      workerId,
      scheduled,
      reconciled,
      claimed,
      processed,
      isolatedFailures,
      elapsedMs: Date.now() - startedAt,
    }
  }
}
