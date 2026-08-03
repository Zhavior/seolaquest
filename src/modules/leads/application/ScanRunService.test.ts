import type { ClaimedDurableJob } from '@/src/modules/core/jobs/DurableJobRepository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  scanFindUnique: vi.fn(),
  scanCreate: vi.fn(),
  scanUpdateMany: vi.fn(),
  scanFindFirst: vi.fn(),
  keywordCount: vi.fn(),
  subscriptionFind: vi.fn(),
  userUpdateMany: vi.fn(),
  userUpdate: vi.fn(),
  ledgerCreate: vi.fn(),
  ledgerFind: vi.fn(),
  ledgerCreateMany: vi.fn(),
  jobCreate: vi.fn(),
  scheduleRetry: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/src/modules/core/jobs/DurableJobRepository', () => ({
  DurableJobRepository: { scheduleRetry: mocks.scheduleRetry, markSucceeded: vi.fn() },
}))
vi.mock('./ScanProviderService', () => ({
  ScanProviderService: { scanTenant: vi.fn() },
}))

const tx = {
  $queryRaw: mocks.queryRaw,
  scanRun: {
    findUnique: mocks.scanFindUnique,
    create: mocks.scanCreate,
    updateMany: mocks.scanUpdateMany,
  },
  trackedKeyword: { count: mocks.keywordCount },
  billingSubscription: { findUnique: mocks.subscriptionFind },
  user: { updateMany: mocks.userUpdateMany, update: mocks.userUpdate },
  creditLedgerEntry: {
    create: mocks.ledgerCreate,
    findUnique: mocks.ledgerFind,
    createMany: mocks.ledgerCreateMany,
  },
  durableJob: { create: mocks.jobCreate },
}

vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: mocks.transaction,
    scanRun: { findFirst: mocks.scanFindFirst, updateMany: mocks.scanUpdateMany },
  },
}))

import { ScanRunService } from './ScanRunService'

function terminalJob() {
  return {
    id: 'job-1',
    userId: 'user-1',
    scanRunId: 'run-1',
    attempts: 5,
    maxAttempts: 5,
    leaseOwner: 'worker-1',
    leaseGeneration: 3,
  } as unknown as ClaimedDurableJob
}

describe('ScanRunService economic boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx))
    mocks.queryRaw
      .mockResolvedValueOnce([{ now: new Date('2026-07-30T12:07:00.000Z') }])
      .mockResolvedValueOnce([{ id: 'user-1', questsRemaining: 3 }])
    mocks.scanFindUnique.mockResolvedValue(null)
    mocks.scanCreate.mockResolvedValue({ id: 'run-1', userId: 'user-1' })
    mocks.keywordCount.mockResolvedValue(1)
    mocks.subscriptionFind.mockResolvedValue({
      plan: 'BETA',
      status: 'active',
      currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z'),
    })
    mocks.userUpdateMany.mockResolvedValue({ count: 1 })
    mocks.ledgerCreate.mockResolvedValue({ id: 'debit-1' })
    mocks.jobCreate.mockResolvedValue({ id: 'job-1' })
  })

  it('atomically creates one run, debit ledger entry, and durable job', async () => {
    await expect(ScanRunService.enqueueManual('user-1')).resolves.toEqual({
      queued: true,
      existing: false,
      runId: 'run-1',
    })
    expect(mocks.ledgerCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        delta: -1,
        reason: 'MANUAL_SCAN_DEBIT',
        sourceType: 'SCAN_RUN_DEBIT',
        sourceId: 'run-1',
      },
    })
    expect(mocks.jobCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        kind: 'TENANT_SCAN',
        dedupeKey: 'scan:run-1',
        scanRunId: 'run-1',
      }),
    })
  })

  it('deduplicates a second acceptance in the same tenant window before spending credit', async () => {
    mocks.scanFindUnique.mockResolvedValue({ id: 'run-existing' })
    await expect(ScanRunService.enqueueManual('user-1')).resolves.toEqual({
      queued: false,
      existing: true,
      runId: 'run-existing',
    })
    expect(mocks.userUpdateMany).not.toHaveBeenCalled()
    expect(mocks.ledgerCreate).not.toHaveBeenCalled()
  })

  it('fails closed before creating work when the locked balance has no credit', async () => {
    mocks.queryRaw.mockReset()
      .mockResolvedValueOnce([{ now: new Date('2026-07-30T12:07:00.000Z') }])
      .mockResolvedValueOnce([{ id: 'user-1', questsRemaining: 0 }])
    await expect(ScanRunService.enqueueManual('user-1')).resolves.toEqual({
      queued: false,
      reason: 'NO_CREDITS',
    })
    expect(mocks.ledgerCreate).not.toHaveBeenCalled()
    expect(mocks.jobCreate).not.toHaveBeenCalled()
  })

  it('terminally fences and refunds a dead scan exactly once', async () => {
    mocks.queryRaw.mockReset().mockResolvedValue([{ id: 'job-1' }])
    mocks.scanFindUnique.mockResolvedValue({
      id: 'run-1', userId: 'user-1', status: 'RUNNING',
    })
    mocks.ledgerFind.mockResolvedValue({ userId: 'user-1', delta: -1 })
    mocks.ledgerCreateMany.mockResolvedValue({ count: 1 })
    mocks.userUpdate.mockResolvedValue({ id: 'user-1' })
    mocks.scanUpdateMany.mockResolvedValue({ count: 1 })

    await expect(ScanRunService.handleClaimedJobFailure(
      terminalJob(),
      Object.assign(new Error('unavailable'), { code: 'ALL_SCAN_PROVIDERS_UNAVAILABLE' }),
    )).resolves.toBe(true)
    expect(mocks.ledgerCreateMany).toHaveBeenCalledWith({
      data: [{
        userId: 'user-1',
        delta: 1,
        reason: 'SCAN_RUN_REFUND_TERMINAL_FAILURE',
        sourceType: 'SCAN_RUN_REFUND',
        sourceId: 'run-1',
      }],
      skipDuplicates: true,
    })
    expect(mocks.userUpdate).toHaveBeenCalledTimes(1)

    mocks.ledgerCreateMany.mockResolvedValue({ count: 0 })
    mocks.userUpdate.mockClear()
    await ScanRunService.handleClaimedJobFailure(terminalJob(), new Error('again'))
    expect(mocks.userUpdate).not.toHaveBeenCalled()
  })

  it('uses a retry instead of refunding before max attempts', async () => {
    const job = { ...terminalJob(), attempts: 2 }
    mocks.scheduleRetry.mockResolvedValue(true)
    await ScanRunService.handleClaimedJobFailure(job, new Error('temporary'))
    expect(mocks.scheduleRetry).toHaveBeenCalledWith(job, 2, 'ERROR')
    expect(mocks.ledgerCreateMany).not.toHaveBeenCalled()
  })

  it('returns only the tenant-scoped run status with provider aggregates and current balance', async () => {
    mocks.scanFindFirst.mockResolvedValue({
      id: 'run-1',
      status: 'SUCCEEDED',
      leadsCreated: 2,
      lastErrorCode: 'PARTIAL_PROVIDER_OUTAGE',
      completedAt: new Date('2026-08-01T12:00:00.000Z'),
      user: { questsRemaining: 41 },
      providerAttempts: [
        { provider: 'REDDIT', outcome: 'SUCCESS', resultCount: 2, insertedCount: 2, rateLimitResetAt: null },
        { provider: 'X', outcome: 'RATE_LIMITED', resultCount: 0, insertedCount: 0, rateLimitResetAt: new Date('2026-08-01T12:05:00.000Z') },
      ],
    })

    await expect(ScanRunService.getStatus('user-1', 'run-1')).resolves.toEqual(expect.objectContaining({
      id: 'run-1',
      status: 'SUCCEEDED',
      counts: { leadsCreated: 2, providerAttempts: 2, providerResults: 2 },
      refunded: false,
      errorCode: 'PARTIAL_PROVIDER_OUTAGE',
      balance: 41,
      provider: expect.objectContaining({ status: 'PARTIAL_OUTAGE' }),
    }))
    expect(mocks.scanFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'run-1', userId: 'user-1' },
    }))
  })

  it('does not reveal whether another tenant scan exists', async () => {
    mocks.scanFindFirst.mockResolvedValue(null)
    await expect(ScanRunService.getStatus('user-1', 'other-run')).resolves.toBeNull()
    expect(mocks.scanFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'other-run', userId: 'user-1' },
    }))
  })
})
