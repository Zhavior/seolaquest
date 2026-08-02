import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  createMany: vi.fn(),
  findLedger: vi.fn(),
  updateUser: vi.fn(),
  updateManyUsers: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: mocks.transaction,
  },
}))

import { CreditService } from './CreditService'

describe('invoice credit economic idempotency', () => {
  let balance: number
  let capacity: number
  let ledger: Map<string, { userId: string; delta: number }>

  beforeEach(() => {
    balance = 0
    capacity = 0
    ledger = new Map()
    vi.clearAllMocks()

    const tx = {
      creditLedgerEntry: {
        createMany: mocks.createMany,
        findUnique: mocks.findLedger,
      },
      user: {
        update: mocks.updateUser,
        updateMany: mocks.updateManyUsers,
      },
    }
    mocks.transaction.mockImplementation(async (fn) => fn(tx))
    mocks.createMany.mockImplementation(async ({ data }) => {
      const row = data[0]
      const key = `${row.sourceType}:${row.sourceId}`
      if (ledger.has(key)) return { count: 0 }
      ledger.set(key, { userId: row.userId, delta: row.delta })
      return { count: 1 }
    })
    mocks.findLedger.mockImplementation(async ({ where }) => {
      const key = `${where.sourceType_sourceId.sourceType}:${where.sourceType_sourceId.sourceId}`
      const row = ledger.get(key)
      return row ? { ...row } : null
    })
    mocks.updateUser.mockImplementation(async ({ data }) => {
      balance += data.questsRemaining.increment
      return { questsRemaining: balance }
    })
    mocks.updateManyUsers.mockImplementation(async ({ where, data }) => {
      if (capacity < where.maxCredits.lt) capacity = data.maxCredits
      return { count: 1 }
    })
  })

  const deliverInvoice = (eventId: string, invoiceId: string) => {
    void eventId
    return CreditService.grantInvoiceAllocation({
      userId: 'user_1',
      credits: 50,
      sourceType: 'STRIPE_INVOICE',
      sourceId: invoiceId,
      reason: 'PLAN_PERIOD_ALLOCATION',
    })
  }

  it('does not double-grant one invoice delivered under different Stripe event IDs', async () => {
    await expect(deliverInvoice('evt_1', 'in_same')).resolves.toEqual({ granted: true })
    await expect(deliverInvoice('evt_2', 'in_same')).resolves.toEqual({ granted: false })
    expect(balance).toBe(50)
    expect(capacity).toBe(50)
    expect(mocks.updateUser).toHaveBeenCalledTimes(1)
  })

  it('grants each distinct paid renewal invoice once and grows capacity without shrinking balance', async () => {
    balance = 6000
    capacity = 6000
    await deliverInvoice('evt_cycle_1', 'in_cycle_1')
    await deliverInvoice('evt_cycle_2', 'in_cycle_2')
    expect(balance).toBe(6100)
    expect(capacity).toBe(6100)
  })

  it('reuses a caller transaction instead of opening a second database connection', async () => {
    const callerTx = {
      creditLedgerEntry: { createMany: mocks.createMany, findUnique: mocks.findLedger },
      user: { update: mocks.updateUser, updateMany: mocks.updateManyUsers },
    }
    await expect(CreditService.grantInvoiceAllocation({
      userId: 'user_1',
      credits: 50,
      sourceType: 'STRIPE_INVOICE',
      sourceId: 'in_shared_tx',
      reason: 'PLAN_PERIOD_ALLOCATION',
    }, callerTx as never)).resolves.toEqual({ granted: true })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})
