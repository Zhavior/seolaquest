import { describe, expect, it, vi } from 'vitest'

import prisma from '@/lib/prisma'
import { ScanReconciliationService } from './ScanReconciliationService'
import { ScanRunService } from './ScanRunService'

vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}))

vi.mock('./ScanRunService', () => ({
  ScanRunService: {
    refundScanInTransaction: vi.fn(),
  },
}))

const mockedPrisma = prisma as unknown as {
  $queryRaw: ReturnType<typeof vi.fn>
  $transaction: ReturnType<typeof vi.fn>
}

const mockedScanRunService = ScanRunService as unknown as {
  refundScanInTransaction: ReturnType<typeof vi.fn>
}

describe('ScanReconciliationService', () => {
  it('returns a summary with candidates, refunded, failed, and items', async () => {
    mockedPrisma.$queryRaw.mockResolvedValue([
      { id: 'run-1', errorCode: 'DEAD_JOB_RECONCILED' },
      { id: 'run-2', errorCode: 'STRANDED_SCAN_RECONCILED' },
    ])

    mockedPrisma.$transaction.mockImplementation(async (fn) => fn({} as never))
    mockedScanRunService.refundScanInTransaction
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const summary = await ScanReconciliationService.reconcile(10)

    expect(summary.candidates).toBe(2)
    expect(summary.refunded).toBe(1)
    expect(summary.failed).toBe(1)
    expect(summary.items).toHaveLength(2)

    const succeeded = summary.items.find((item) => item.runId === 'run-1')
    const skipped = summary.items.find((item) => item.runId === 'run-2')

    expect(succeeded?.outcome).toBe('REFUND_SUCCEEDED')
    expect(succeeded?.errorCode).toBe('DEAD_JOB_RECONCILED')

    expect(skipped?.outcome).toBe('REFUND_SKIPPED')
    expect(skipped?.errorCode).toBe('STRANDED_SCAN_RECONCILED')
  })

  it('records failed outcomes and logs when refund throws', async () => {
    mockedPrisma.$queryRaw.mockResolvedValue([{ id: 'run-3', errorCode: 'DEAD_JOB_RECONCILED' }])

    mockedPrisma.$transaction.mockImplementation(async () => {
      throw new Error('refund failed')
    })

    const summary = await ScanReconciliationService.reconcile(5)

    expect(summary.candidates).toBe(1)
    expect(summary.refunded).toBe(0)
    expect(summary.failed).toBe(1)
    expect(summary.items).toHaveLength(1)

    const item = summary.items[0]
    expect(item.runId).toBe('run-3')
    expect(item.outcome).toBe('REFUND_FAILED')
  })
})
