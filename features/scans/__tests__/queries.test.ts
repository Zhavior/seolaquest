import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  getStatus: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: {
    scanRun: {
      findMany: mocks.findMany,
      findFirst: mocks.findFirst,
    },
  },
}))
vi.mock('@/src/modules/leads/application/ScanRunService', () => ({
  ScanRunService: { getStatus: mocks.getStatus },
}))

import { getCurrentUserScanRun, listCurrentUserScanRuns } from '../queries'

const RUN_ID = '11111111-1111-4111-8111-111111111111'

function listRow() {
  return {
    id: RUN_ID,
    status: 'SUCCEEDED',
    trigger: 'MANUAL',
    leadsCreated: 2,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:05:00.000Z'),
    completedAt: new Date('2026-08-01T10:04:00.000Z'),
    providerAttempts: [{
      provider: 'REDDIT',
      outcome: 'SUCCESS',
      resultCount: 4,
      insertedCount: 2,
      rateLimitResetAt: null,
    }],
  }
}

describe('scan queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'tenant-1' })
    mocks.findMany.mockResolvedValue([listRow()])
    mocks.findFirst.mockResolvedValue({
      id: RUN_ID,
      trigger: 'MANUAL',
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
      updatedAt: new Date('2026-08-01T10:05:00.000Z'),
    })
    mocks.getStatus.mockResolvedValue({
      id: RUN_ID,
      status: 'SUCCEEDED',
      counts: { leadsCreated: 2, providerAttempts: 1, providerResults: 4 },
      completedAt: new Date('2026-08-01T10:04:00.000Z'),
      refunded: false,
      errorCode: null,
      balance: 12,
      provider: { status: 'AVAILABLE', providers: [] },
    })
  })

  it('lists only the current tenant and selects only customer-safe scan fields', async () => {
    const result = await listCurrentUserScanRuns()

    expect(result.runs[0]).toMatchObject({
      id: RUN_ID,
      status: 'SUCCEEDED',
      counts: { leadsCreated: 2, providerAttempts: 1, providerResults: 4 },
    })
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'tenant-1' },
      take: 101,
    }))

    const select = mocks.findMany.mock.calls[0][0].select
    expect(select).not.toHaveProperty('lastErrorCode')
    expect(select).not.toHaveProperty('activeKey')
    expect(select).not.toHaveProperty('user')
    expect(select.providerAttempts.select).not.toHaveProperty('httpStatusClass')
  })

  it('loads detail through the tenant-scoped ScanRunService contract and metadata lookup', async () => {
    await expect(getCurrentUserScanRun(RUN_ID)).resolves.toMatchObject({
      id: RUN_ID,
      status: 'SUCCEEDED',
      updatedAt: '2026-08-01T10:05:00.000Z',
      completedAt: '2026-08-01T10:04:00.000Z',
      currentBalance: 12,
    })
    expect(mocks.getStatus).toHaveBeenCalledWith('tenant-1', RUN_ID)
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: RUN_ID, userId: 'tenant-1' },
    }))
  })

  it('authenticates before rejecting an invalid run ID', async () => {
    await expect(getCurrentUserScanRun('not-a-uuid')).resolves.toBeNull()
    expect(mocks.requireCurrentUser).toHaveBeenCalledTimes(1)
    expect(mocks.getStatus).not.toHaveBeenCalled()
    expect(mocks.findFirst).not.toHaveBeenCalled()
  })

  it('returns the same null result for a missing or other-tenant run', async () => {
    mocks.getStatus.mockResolvedValue(null)
    mocks.findFirst.mockResolvedValue(null)
    await expect(getCurrentUserScanRun(RUN_ID)).resolves.toBeNull()
  })
})
