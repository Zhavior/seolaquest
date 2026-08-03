import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  executeRaw: vi.fn(),
  requestFind: vi.fn(),
  auditFind: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: { $transaction: mocks.transaction },
}))

import {
  DELETION_BARRIER_TESTING,
  deletionBlocksBilling,
  withUserDeletionLock,
} from './DeletionBillingBarrier'

describe('deletion billing barrier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('DELETION_AUDIT_SECRET', 'test-deletion-secret')
    mocks.requestFind.mockResolvedValue(null)
    mocks.auditFind.mockResolvedValue(null)
    mocks.transaction.mockImplementation(async (callback) => callback({
      $executeRaw: mocks.executeRaw,
      accountDeletionRequest: { findUnique: mocks.requestFind },
      accountDeletionAudit: { findUnique: mocks.auditFind },
    }))
  })

  it('takes the subject advisory lock before exposing deletion state', async () => {
    const order: string[] = []
    mocks.executeRaw.mockImplementation(async () => { order.push('lock') })
    mocks.requestFind.mockImplementation(async () => { order.push('request'); return null })
    mocks.auditFind.mockImplementation(async () => { order.push('audit'); return null })

    await withUserDeletionLock('user_1', async (_tx, state) => {
      order.push('work')
      expect(deletionBlocksBilling(state)).toBe(false)
    })

    expect(order[0]).toBe('lock')
    expect(order.at(-1)).toBe('work')
    expect(mocks.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      DELETION_BARRIER_TESTING.SUBJECT_TRANSACTION_OPTIONS,
    )
  })

  it('blocks billing for prepared, pending, or completed deletion state', async () => {
    mocks.requestFind.mockResolvedValue({
      id: 'delete_1',
      status: 'AWAITING_IDENTITY_DELETE',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })

    await withUserDeletionLock('user_1', async (_tx, state) => {
      expect(deletionBlocksBilling(state)).toBe(true)
    })
  })
})
