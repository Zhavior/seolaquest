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
vi.mock('./DurableJobRepository', async (importOriginal) => {
  const original = await importOriginal<typeof import('./DurableJobRepository')>()
  return { ...original, DurableJobRepository: { claimBatch: mocks.claimBatch } }
})
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
vi.mock('@/src/modules/core/infrastructure/logger', () => ({
  logger: { error: mocks.loggerError },
}))

import { JobWorkerService, WorkerPreparationError } from './JobWorkerService'

function job(id: string, kind: string) {
  return {
    id,
    kind,
    userId: `user-${id}`,
    leaseOwner: 'worker-1',
    leaseGeneration: 1,
  } as unknown as ClaimedDurableJob
}

describe('JobWorkerService failure isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.enqueueDue.mockResolvedValue({ due: 0, queued: 0 })
    mocks.reconcile.mockResolvedValue({ candidates: 0, refunded: 0 })
    mocks.scanProcess.mockResolvedValue(undefined)
    mocks.scanFailure.mockResolvedValue(true)
    mocks.crmProcess.mockResolvedValue(undefined)
    mocks.crmFailure.mockResolvedValue(true)
  })

  it('continues to the next tenant when one poisoned job and its handler fail', async () => {
    const poisoned = job('poisoned', 'TENANT_SCAN')
    const healthy = job('healthy', 'CRM_EXPORT')
    mocks.claimBatch
      .mockResolvedValueOnce([poisoned])
      .mockResolvedValueOnce([healthy])
    mocks.scanProcess.mockRejectedValue(new Error('provider failed'))
    mocks.scanFailure.mockRejectedValue(new Error('failure handler failed'))

    await expect(JobWorkerService.runCycle({ workerId: 'worker-1', batchSize: 2 })).resolves.toMatchObject({
      claimed: 2,
      processed: 2,
      isolatedFailures: 1,
    })
    expect(mocks.crmProcess).toHaveBeenCalledWith(healthy)
    expect(mocks.loggerError).toHaveBeenCalledTimes(1)
    expect(mocks.claimBatch).toHaveBeenNthCalledWith(1, { workerId: 'worker-1', batchSize: 1 })
    expect(mocks.claimBatch).toHaveBeenNthCalledWith(2, { workerId: 'worker-1', batchSize: 1 })
  })

  it('never leases work after the cycle wall-time budget is exhausted', async () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValueOnce(1_000).mockReturnValueOnce(6_000).mockReturnValue(6_000)

    await expect(JobWorkerService.runCycle({ workerId: 'worker-1', wallTimeMs: 5_000 })).resolves.toMatchObject({
      claimed: 0,
      processed: 0,
    })
    expect(mocks.claimBatch).not.toHaveBeenCalled()
    now.mockRestore()
  })

  it('fails the cycle before claiming jobs when the active-keyword invariant is violated', async () => {
    mocks.enqueueDue.mockRejectedValue(new mocks.ActiveKeywordLimitExceededError())

    await expect(JobWorkerService.runCycle({ workerId: 'worker-1' })).rejects.toBeInstanceOf(
      mocks.ActiveKeywordLimitExceededError,
    )
    expect(mocks.claimBatch).not.toHaveBeenCalled()
    expect(mocks.loggerError).toHaveBeenCalledWith(
      { outcomeCode: 'ACTIVE_KEYWORD_LIMIT_EXCEEDED' },
      'Scan scheduler step failed',
    )
  })

  it('fails the cycle before claim when schedule preparation is unavailable', async () => {
    mocks.enqueueDue.mockRejectedValue(new Error('database details must not escape'))

    await expect(JobWorkerService.runCycle({ workerId: 'worker-1' })).rejects.toMatchObject({
      name: 'WorkerPreparationError',
      code: 'SCAN_SCHEDULER_FAILED',
      message: 'SCAN_SCHEDULER_FAILED',
    } satisfies Partial<WorkerPreparationError>)
    expect(mocks.claimBatch).not.toHaveBeenCalled()
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain('database details')
  })

  it('fails the cycle before claim when scan refund reconciliation is unavailable', async () => {
    mocks.reconcile.mockRejectedValue(new Error('database details must not escape'))

    await expect(JobWorkerService.runCycle({ workerId: 'worker-1' })).rejects.toMatchObject({
      name: 'WorkerPreparationError',
      code: 'SCAN_RECONCILIATION_FAILED',
      message: 'SCAN_RECONCILIATION_FAILED',
    } satisfies Partial<WorkerPreparationError>)
    expect(mocks.claimBatch).not.toHaveBeenCalled()
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain('database details')
  })
})
