import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  entitlementsForUser: vi.fn(),
  trackedKeywordFindMany: vi.fn(),
  leadFindUnique: vi.fn(),
  leadCreate: vi.fn(),
  userUpdateMany: vi.fn(),
  userUpdate: vi.fn(),
  creditLedgerCreate: vi.fn(),
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/src/modules/billing/application/EntitlementService', () => ({
  EntitlementService: { forUser: mocks.entitlementsForUser },
}))
vi.mock('@/lib/prisma', () => ({
  default: {
    trackedKeyword: { findMany: mocks.trackedKeywordFindMany },
    lead: {
      findUnique: mocks.leadFindUnique,
      create: mocks.leadCreate,
    },
    $transaction: mocks.transaction,
  },
}))

import { scanForLeadsAction } from './actions'

const tx = {
  user: {
    updateMany: mocks.userUpdateMany,
    update: mocks.userUpdate,
  },
  creditLedgerEntry: { create: mocks.creditLedgerCreate },
}

const activeBeta = {
  plan: 'BETA',
  subscriptionStatus: 'active',
  canUsePaidScans: true,
  canGenerateAIReplies: true,
  canExportToCRM: true,
}

describe('scanForLeadsAction entitlements and credits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.entitlementsForUser.mockResolvedValue(activeBeta)
    mocks.trackedKeywordFindMany.mockResolvedValue([
      { id: 'keyword-1', phrase: 'need a CRM' },
    ])
    mocks.userUpdateMany.mockResolvedValue({ count: 1 })
    mocks.creditLedgerCreate.mockResolvedValue({ id: 'ledger-1' })
    mocks.userUpdate.mockResolvedValue({ id: 'user-1' })
    mocks.transaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx),
    )
  })

  it.each([
    ['free', 'inactive'],
    ['past-due', 'past_due'],
  ])('denies %s users before loading keywords or spending credit', async (_label, subscriptionStatus) => {
    mocks.entitlementsForUser.mockResolvedValue({
      plan: 'FREE',
      subscriptionStatus,
      canUsePaidScans: false,
      canGenerateAIReplies: false,
      canExportToCRM: false,
    })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(scanForLeadsAction()).resolves.toEqual({
      ok: false,
      message: 'Manual scanning requires an active paid subscription.',
    })
    expect(mocks.trackedKeywordFindMany).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails closed when an active Beta user has no scan credits', async () => {
    mocks.userUpdateMany.mockResolvedValue({ count: 0 })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(scanForLeadsAction()).resolves.toEqual({
      ok: false,
      message: 'No scan credits remaining.',
    })
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.creditLedgerCreate).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('charges an active Beta tenant exactly once for a successful scan run', async () => {
    mocks.trackedKeywordFindMany.mockResolvedValue([
      { id: 'keyword-1', phrase: 'need a CRM' },
      { id: 'keyword-2', phrase: 'sales pipeline' },
    ])
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { children: [] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(scanForLeadsAction()).resolves.toEqual({
      ok: true,
      created: 0,
      message: 'Scan complete. No new social posts found.',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.creditLedgerCreate).toHaveBeenCalledTimes(1)
    expect(mocks.creditLedgerCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        delta: -1,
        reason: 'MANUAL_SCAN_DEBIT',
        sourceType: 'MANUAL_SCAN',
        sourceId: expect.any(String),
      },
    })
    expect(mocks.userUpdate).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/')
  })

  it('refunds the same run when every configured provider is unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(scanForLeadsAction()).resolves.toEqual({
      ok: false,
      created: 0,
      message: 'All configured sources were unavailable. Your scan credit was refunded.',
    })
    expect(mocks.transaction).toHaveBeenCalledTimes(2)
    expect(mocks.creditLedgerCreate).toHaveBeenCalledTimes(2)
    const debit = mocks.creditLedgerCreate.mock.calls[0][0].data
    const refund = mocks.creditLedgerCreate.mock.calls[1][0].data
    expect(debit).toMatchObject({
      userId: 'user-1',
      delta: -1,
      reason: 'MANUAL_SCAN_DEBIT',
      sourceType: 'MANUAL_SCAN',
    })
    expect(refund).toEqual({
      userId: 'user-1',
      delta: 1,
      reason: 'MANUAL_SCAN_REFUND_ALL_SOURCES_FAILED',
      sourceType: 'MANUAL_SCAN_REFUND',
      sourceId: debit.sourceId,
    })
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { questsRemaining: { increment: 1 } },
    })
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
})
