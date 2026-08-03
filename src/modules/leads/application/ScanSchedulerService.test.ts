import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  enqueue: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('./ScanRunService', () => ({ enqueueScanInTransaction: mocks.enqueue }))

const tx = { $queryRaw: mocks.queryRaw, $executeRaw: mocks.executeRaw }
vi.mock('@/lib/prisma', () => ({ default: { $transaction: mocks.transaction } }))

import {
  ActiveKeywordLimitExceededError,
  ScanSchedulerService,
} from './ScanSchedulerService'

function sqlAt(callIndex: number) {
  const [template] = mocks.queryRaw.mock.calls[callIndex]
  return Array.from(template as TemplateStringsArray).join('?')
}

describe('ScanSchedulerService fairness and adoption repair', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx))
    mocks.executeRaw.mockResolvedValue(1)
    mocks.enqueue.mockResolvedValue({ queued: true, runId: 'run-1' })
  })

  it('reconciles schedules idempotently before dispatch', async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await expect(ScanSchedulerService.enqueueDueSchedules(2)).resolves.toEqual({
      due: 0,
      queued: 0,
      existing: 0,
      skipped: 0,
      reconciled: { created: 1, disabled: 1 },
    })

    const createSql = Array.from(mocks.executeRaw.mock.calls[0][0] as TemplateStringsArray).join('?')
    const disableSql = Array.from(mocks.executeRaw.mock.calls[1][0] as TemplateStringsArray).join('?')
    expect(createSql).toContain('INSERT INTO "TenantScanSchedule"')
    expect(createSql).toContain('ON CONFLICT ("userId") DO NOTHING')
    expect(createSql).toContain('keyword."userId", false')
    expect(disableSql).toContain('NOT EXISTS')
    expect(disableSql).toContain('keyword."active" = true')
    expect(mocks.transaction).toHaveBeenCalledTimes(2)
  })

  it('locks User before schedule, then advances each claimed tenant', async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ userId: 'user-a' }, { userId: 'user-b' }])
      .mockResolvedValueOnce([{ id: 'user-a' }])
      .mockResolvedValueOnce([{ userId: 'user-a' }])
      .mockResolvedValueOnce([{ id: 'user-b' }])
      .mockResolvedValueOnce([{ userId: 'user-b' }])

    await expect(ScanSchedulerService.enqueueDueSchedules(2)).resolves.toEqual({
      due: 2,
      queued: 2,
      existing: 0,
      skipped: 0,
      reconciled: { created: 1, disabled: 1 },
    })

    expect(sqlAt(1)).toContain('ORDER BY schedule."nextDueAt", schedule."userId"')
    expect(sqlAt(1)).not.toContain('FOR UPDATE')
    expect(sqlAt(2)).toContain('FROM "User" AS app_user')
    expect(sqlAt(2)).toContain('FOR UPDATE OF app_user SKIP LOCKED')
    expect(sqlAt(3)).toContain('FROM "TenantScanSchedule" AS schedule')
    expect(sqlAt(3)).toContain('FOR UPDATE OF schedule SKIP LOCKED')
    expect(mocks.enqueue.mock.calls.map((call) => call[1])).toEqual(['user-a', 'user-b'])
    expect(mocks.executeRaw).toHaveBeenCalledTimes(4)
  })

  it('fails before schedule writes or dispatch when a tenant exceeds the provider budget', async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ userId: 'redacted', activeKeywordCount: 11 }])

    await expect(ScanSchedulerService.enqueueDueSchedules()).rejects.toBeInstanceOf(
      ActiveKeywordLimitExceededError,
    )
    expect(sqlAt(0)).toContain('HAVING COUNT(*) > ?')
    expect(mocks.executeRaw).not.toHaveBeenCalled()
    expect(mocks.enqueue).not.toHaveBeenCalled()
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
  })

  it('skips a contended tenant without acquiring its schedule lock', async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ userId: 'user-a' }])
      .mockResolvedValueOnce([])

    await expect(ScanSchedulerService.enqueueDueSchedules()).resolves.toMatchObject({ due: 0, queued: 0 })
    expect(mocks.queryRaw).toHaveBeenCalledTimes(3)
    expect(mocks.enqueue).not.toHaveBeenCalled()
  })
})
