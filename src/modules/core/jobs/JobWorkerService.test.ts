import type { ClaimedDurableJob } from './DurableJobRepository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  enqueueDue: vi.fn(),
  reconcile: vi.fn(),
  claimBatch: vi.fn(),
  scanProcess: vi.fn(),
  scanFailure: vi.fn(),
  crmProcess: vi.fn(),
  crmFailure: vi.fn(),
  loggerError: vi.fn(),
  ActiveKeywordLimitExceededError: class ActiveKeywordLimitExceededError extends Error {},
}))

vi.mock('server-only', () => ({}))

vi.mock('@/src/modules/leads/application/ScanSchedulerService', () => ({
  ScanSchedulerService: { enqueueDueSchedules: mocks.enqueueDue },
  ActiveKeywordLimitExceededError: mocks.ActiveKeywordLimitExceededError,
}))

vi.mock('@/src/modules/leads/application/ScanReconciliationService', () => ({
  ScanReconciliationService: { reconcile: mocks.reconcile },
}))

vi.mock('@/src/modules/leads/application/ScanRunService', () => ({
  ScanRunService: {
    processClaimedJob: mocks.scanProcess,
    handleClaimedJobFailure: mocks.scanFailure,
  },
}))

vi.mock('@/src/modules/leads/application/CrmDeliveryService', () => ({
  CrmDeliveryService: {
    processClaimedJob: mocks.crmProcess,
    handleClaimedJobFailure: mocks.crmFailure,
  },
}))

vi.mock('./DurableJobRepository', () => ({
  DurableJobRepository: {
    claimBatch: mocks.claimBatch,
  },
}))

vi.mock('@/src/modules/core/infrastructure/logger', () => ({
  logger: {
    error: mocks.loggerError,
  },
}))

import {
  JobWorkerService,
  WorkerPreparationError,
} from './JobWorkerService'

function makeJob(overrides?: Partial<ClaimedDurableJob>): ClaimedDurableJob {
  return {
    id: 'job-1',
    kind: 'TENANT_SCAN',
    tenantId: 'tenant-1',
    payload: {},
    ...overrides,
  } as ClaimedDurableJob
}

describe('JobWorkerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.enqueueDue.mockResolvedValue({ queued: 1 })
    mocks.reconcile.mockResolvedValue({ candidates: 0, refunded: 0, failed: 0, items: [] })
    mocks.claimBatch.mockResolvedValue([])
    mocks.scanProcess.mockResolvedValue(undefined)
    mocks.scanFailure.mockResolvedValue(undefined)
    mocks.crmProcess.mockResolvedValue(undefined)
    mocks.crmFailure.mockResolvedValue(undefined)
  })

  it('returns a structured cycle report when no jobs are available', async () => {
    const result = await JobWorkerService.runCycle({
      workerId: 'worker-1',
      batchSize: 2,
    })

    expect(result.ok).toBe(true)
    expect(result.workerId).toBe('worker-1')
    expect(result.preparation.scheduled).toEqual({ queued: 1 })
    expect(result.preparation.reconciled).toEqual({
      candidates: 0,
      refunded: 0,
      failed: 0,
      items: [],
    })
    expect(result.execution).toEqual({
      claimed: 0,
      processed: 0,
      isolatedFailures: 0,
    })
    expect(result.stopReason).toBe('NO_JOBS')

    expect(result.scheduled).toEqual({ queued: 1 })
    expect(result.reconciled).toEqual({
      candidates: 0,
      refunded: 0,
      failed: 0,
      items: [],
    })
    expect(result.claimed).toBe(0)
    expect(result.processed).toBe(0)
    expect(result.isolatedFailures).toBe(0)
  })

  it('processes a tenant scan job and stops at the batch limit', async () => {
    mocks.claimBatch
      .mockResolvedValueOnce([makeJob({ id: 'job-1', kind: 'TENANT_SCAN' })])
      .mockResolvedValueOnce([makeJob({ id: 'job-2', kind: 'TENANT_SCAN' })])

    const result = await JobWorkerService.runCycle({
      workerId: 'worker-2',
      batchSize: 2,
    })

    expect(mocks.scanProcess).toHaveBeenCalledTimes(2)
    expect(result.execution).toEqual({
      claimed: 2,
      processed: 2,
      isolatedFailures: 0,
    })
    expect(result.stopReason).toBe('BATCH_LIMIT_REACHED')
  })

  it('continues to the next tenant when one poisoned job and its handler fail', async () => {
    mocks.claimBatch
      .mockResolvedValueOnce([makeJob({ id: 'bad-job', kind: 'TENANT_SCAN' })])
      .mockResolvedValueOnce([makeJob({ id: 'good-job', kind: 'TENANT_SCAN' })])
      .mockResolvedValueOnce([])

    const poisoned = new Error('poisoned')
    const failureHandlerError = new Error('failure handler failed')

    mocks.scanProcess
      .mockRejectedValueOnce(poisoned)
      .mockResolvedValueOnce(undefined)

    mocks.scanFailure.mockRejectedValueOnce(failureHandlerError)

    const result = await JobWorkerService.runCycle({
      workerId: 'worker-3',
      batchSize: 4,
    })

    expect(result.execution.claimed).toBe(2)
    expect(result.execution.processed).toBe(2)
    expect(result.execution.isolatedFailures).toBe(1)
    expect(mocks.loggerError).toHaveBeenCalled()
  })

  it('never leases work after the cycle wall-time budget is exhausted', async () => {
    const now = vi
      .spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(6_000)
      .mockReturnValueOnce(6_000)

    try {
      const result = await JobWorkerService.runCycle({
        workerId: 'worker-4',
        wallTimeMs: 5_000,
        batchSize: 3,
      })

      expect(result.execution).toEqual({
        claimed: 0,
        processed: 0,
        isolatedFailures: 0,
      })
      expect(result.stopReason).toBe('WALL_TIME_REACHED')
      expect(mocks.claimBatch).not.toHaveBeenCalled()
    } finally {
      now.mockRestore()
    }
  })

  it('fails the cycle before claim when schedule preparation is unavailable', async () => {
    mocks.enqueueDue.mockRejectedValueOnce(new Error('scheduler down'))

    await expect(JobWorkerService.runCycle()).rejects.toEqual(
      new WorkerPreparationError('SCAN_SCHEDULER_FAILED'),
    )

    expect(mocks.claimBatch).not.toHaveBeenCalled()
  })

  it('fails the cycle before claim when scan refund reconciliation is unavailable', async () => {
    mocks.reconcile.mockRejectedValueOnce(new Error('reconciliation down'))

    await expect(JobWorkerService.runCycle()).rejects.toEqual(
      new WorkerPreparationError('SCAN_RECONCILIATION_FAILED'),
    )

    expect(mocks.claimBatch).not.toHaveBeenCalled()
  })

  it('rethrows the active-keyword invariant error before claim', async () => {
    const error = new mocks.ActiveKeywordLimitExceededError('too many active keywords')
    mocks.enqueueDue.mockRejectedValueOnce(error)

    await expect(JobWorkerService.runCycle()).rejects.toBe(error)
    expect(mocks.claimBatch).not.toHaveBeenCalled()
  })

  it('routes CRM jobs to the CRM delivery service', async () => {
    mocks.claimBatch
      .mockResolvedValueOnce([makeJob({ id: 'crm-job', kind: 'CRM_EXPORT' })])
      .mockResolvedValueOnce([])

    const result = await JobWorkerService.runCycle({
      workerId: 'worker-5',
      batchSize: 2,
    })

    expect(mocks.crmProcess).toHaveBeenCalledTimes(1)
    expect(mocks.scanProcess).not.toHaveBeenCalled()
    expect(result.execution.claimed).toBe(1)
    expect(result.execution.processed).toBe(1)
  })
})
