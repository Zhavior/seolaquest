import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { CrmDeliveryService } from '@/src/modules/leads/application/CrmDeliveryService'
import { ScanReconciliationService } from '@/src/modules/leads/application/ScanReconciliationService'
import { ScanRunService } from '@/src/modules/leads/application/ScanRunService'
import {
  ActiveKeywordLimitExceededError,
  ScanSchedulerService,
} from '@/src/modules/leads/application/ScanSchedulerService'
import { DurableJobRepository } from './DurableJobRepository'
import { JobWorkerService, WorkerPreparationError, boundedBatchSize } from './JobWorkerService'

describe('boundedBatchSize', () => {
  it('returns default batch size for undefined', () => {
    expect(boundedBatchSize(undefined)).toBe(4)
  })
  it('returns default batch size for null', () => {
    expect(boundedBatchSize(null as unknown as number | undefined)).toBe(4)
  })
  it('returns default batch size for NaN', () => {
    expect(boundedBatchSize(NaN)).toBe(4)
  })
  it('returns default batch size for non-integer float', () => {
    expect(boundedBatchSize(3.14)).toBe(4)
  })
  it('bounds negative numbers to 1', () => {
    expect(boundedBatchSize(-5)).toBe(1)
  })
  it('bounds 0 to 1', () => {
    expect(boundedBatchSize(0)).toBe(1)
  })
  it('returns a valid safe integer within bounds', () => {
    expect(boundedBatchSize(10)).toBe(10)
  })
  it('bounds large numbers to 25', () => {
    expect(boundedBatchSize(100)).toBe(25)
  })
})

vi.mock('server-only', () => ({}))

vi.mock('@/src/modules/core/infrastructure/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/src/modules/leads/application/ScanSchedulerService', () => ({
  ActiveKeywordLimitExceededError: class ActiveKeywordLimitExceededError extends Error {
    constructor(message = 'ACTIVE_KEYWORD_LIMIT_EXCEEDED') {
      super(message)
      this.name = 'ActiveKeywordLimitExceededError'
    }
  },
  ScanSchedulerService: {
    enqueueDueSchedules: vi.fn(),
  },
}))

vi.mock('@/src/modules/leads/application/ScanReconciliationService', () => ({
  ScanReconciliationService: {
    reconcile: vi.fn(),
  },
}))

vi.mock('./DurableJobRepository', () => ({
  DurableJobRepository: {
    claimBatch: vi.fn(),
  },
}))

vi.mock('@/src/modules/leads/application/ScanRunService', () => ({
  ScanRunService: {
    processClaimedJob: vi.fn(),
    handleClaimedJobFailure: vi.fn(),
  },
}))

vi.mock('@/src/modules/leads/application/CrmDeliveryService', () => ({
  CrmDeliveryService: {
    processClaimedJob: vi.fn(),
    handleClaimedJobFailure: vi.fn(),
  },
}))

const mockedLogger = vi.mocked(logger)
const mockedScheduler = vi.mocked(ScanSchedulerService)
const mockedReconciliation = vi.mocked(ScanReconciliationService)
const mockedDurableJobRepository = vi.mocked(DurableJobRepository)
const mockedScanRunService = vi.mocked(ScanRunService)
const mockedCrmDeliveryService = vi.mocked(CrmDeliveryService)

describe('JobWorkerService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedScheduler.enqueueDueSchedules.mockResolvedValue(0)
    mockedReconciliation.reconcile.mockResolvedValue({
      candidates: 0,
      refunded: 0,
      failed: 0,
      items: [],
    })
    mockedDurableJobRepository.claimBatch.mockResolvedValue([])
  })

  it('returns a structured cycle report when no jobs are available', async () => {
    const report = await JobWorkerService.runCycle({
      workerId: 'worker-1',
      batchSize: 2,
      wallTimeMs: 10_000,
    })

    expect(report).toMatchObject({
      ok: true,
      workerId: 'worker-1',
      preparation: {
        scheduled: 0,
        reconciled: {
          candidates: 0,
          refunded: 0,
          failed: 0,
          items: [],
        },
      },
      execution: {
        claimed: 0,
        processed: 0,
        isolatedFailures: 0,
      },
      stopReason: 'NO_JOBS',
      scheduled: 0,
      reconciled: {
        candidates: 0,
        refunded: 0,
        failed: 0,
        items: [],
      },
      claimed: 0,
      processed: 0,
      isolatedFailures: 0,
    })

    expect(report.elapsedMs).toBeGreaterThanOrEqual(0)
    expect(mockedLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'job_worker_cycle_completed',
        outcomeCode: 'JOB_WORKER_CYCLE_COMPLETED',
        workerId: 'worker-1',
        stopReason: 'NO_JOBS',
      }),
      'Job worker cycle completed',
    )
  })

  it('processes a tenant scan job and stops at the batch limit', async () => {
    mockedDurableJobRepository.claimBatch
      .mockResolvedValueOnce([
        {
          id: 'job-1',
          tenantId: 'tenant-1',
          kind: 'TENANT_SCAN',
          payload: {},
        } as never,
      ])
      .mockResolvedValueOnce([])

    const report = await JobWorkerService.runCycle({
      workerId: 'worker-2',
      batchSize: 1,
      wallTimeMs: 10_000,
    })

    expect(mockedScanRunService.processClaimedJob).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-1', kind: 'TENANT_SCAN' }),
    )
    expect(report.execution).toEqual({
      claimed: 1,
      processed: 1,
      isolatedFailures: 0,
    })
    expect(report.stopReason).toBe('BATCH_LIMIT_REACHED')
  })

  it('continues safely when one poisoned job and its handler fail', async () => {
    mockedDurableJobRepository.claimBatch
      .mockResolvedValueOnce([
        {
          id: 'job-1',
          tenantId: 'tenant-1',
          kind: 'TENANT_SCAN',
          payload: {},
        } as never,
      ])
      .mockResolvedValueOnce([
        {
          id: 'job-2',
          tenantId: 'tenant-2',
          kind: 'TENANT_SCAN',
          payload: {},
        } as never,
      ])
      .mockResolvedValueOnce([])

    mockedScanRunService.processClaimedJob
      .mockRejectedValueOnce(new Error('poisoned-job'))
      .mockResolvedValueOnce(undefined)

    mockedScanRunService.handleClaimedJobFailure.mockRejectedValueOnce(
      new Error('failure-handler-broke'),
    )

    const report = await JobWorkerService.runCycle({
      workerId: 'worker-3',
      batchSize: 2,
      wallTimeMs: 10_000,
    })

    expect(mockedScanRunService.processClaimedJob).toHaveBeenCalled()
    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-1',
        kind: 'TENANT_SCAN',
      }),
      'Durable job failure handler failed',
    )
    expect(report.ok).toBe(true)
    expect(report.execution.isolatedFailures).toBeGreaterThanOrEqual(1)
  })

  it('stops without leasing unbounded work once wall time is exhausted', async () => {
    let claimCalls = 0

    mockedDurableJobRepository.claimBatch.mockImplementation(async () => {
      claimCalls += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return [
        {
          id: `job-${claimCalls}`,
          tenantId: `tenant-${claimCalls}`,
          kind: 'TENANT_SCAN',
          payload: {},
        } as never,
      ]
    })

    const report = await JobWorkerService.runCycle({
      workerId: 'worker-4',
      batchSize: 10,
      wallTimeMs: 5,
    })

    expect(claimCalls).toBeLessThanOrEqual(1)
    expect(report.execution.claimed).toBeLessThanOrEqual(1)
    expect(['WALL_TIME_REACHED', 'BATCH_LIMIT_REACHED']).toContain(report.stopReason)
  })

  it('fails the cycle before claim when schedule preparation is unavailable', async () => {
    mockedScheduler.enqueueDueSchedules.mockRejectedValueOnce(new Error('scheduler unavailable'))

    await expect(
      JobWorkerService.runCycle({
        workerId: 'worker-5',
      }),
    ).rejects.toEqual(new WorkerPreparationError('SCAN_SCHEDULER_FAILED'))

    expect(mockedDurableJobRepository.claimBatch).not.toHaveBeenCalled()
    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        outcomeCode: 'SCAN_SCHEDULER_FAILED',
      }),
      'Scan scheduler step failed',
    )
  })

  it('fails the cycle before claim when scan refund reconciliation is unavailable', async () => {
    mockedReconciliation.reconcile.mockRejectedValueOnce(new Error('reconciliation unavailable'))

    await expect(
      JobWorkerService.runCycle({
        workerId: 'worker-6',
      }),
    ).rejects.toEqual(new WorkerPreparationError('SCAN_RECONCILIATION_FAILED'))

    expect(mockedDurableJobRepository.claimBatch).not.toHaveBeenCalled()
    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        outcomeCode: 'SCAN_RECONCILIATION_FAILED',
      }),
      'Scan reconciliation step failed',
    )
  })

  it('rethrows the active-keyword invariant error before claim', async () => {
    mockedScheduler.enqueueDueSchedules.mockRejectedValueOnce(
      new ActiveKeywordLimitExceededError(),
    )

    await expect(
      JobWorkerService.runCycle({
        workerId: 'worker-7',
      }),
    ).rejects.toBeInstanceOf(ActiveKeywordLimitExceededError)

    expect(mockedDurableJobRepository.claimBatch).not.toHaveBeenCalled()
    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        outcomeCode: 'ACTIVE_KEYWORD_LIMIT_EXCEEDED',
      }),
      'Scan scheduler step failed',
    )
  })

  it('routes CRM jobs to the CRM delivery service', async () => {
    mockedDurableJobRepository.claimBatch
      .mockResolvedValueOnce([
        {
          id: 'job-crm-1',
          tenantId: 'tenant-1',
          kind: 'CRM_EXPORT',
          payload: {},
        } as never,
      ])
      .mockResolvedValueOnce([])

    const report = await JobWorkerService.runCycle({
      workerId: 'worker-8',
      batchSize: 1,
      wallTimeMs: 10_000,
    })

    expect(mockedCrmDeliveryService.processClaimedJob).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-crm-1', kind: 'CRM_EXPORT' }),
    )
    expect(report.execution).toEqual({
      claimed: 1,
      processed: 1,
      isolatedFailures: 0,
    })
    expect(report.stopReason).toBe('BATCH_LIMIT_REACHED')
  })
})
