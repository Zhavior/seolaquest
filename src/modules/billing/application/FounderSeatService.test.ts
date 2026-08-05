import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  subscriptionCount: vi.fn(),
  intentCount: vi.fn(),
  intentUpdate: vi.fn(),
  executeRaw: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    billingSubscription: { count: mocks.subscriptionCount },
    checkoutIntent: { count: mocks.intentCount },
  },
}))

import { FounderSeatService } from './FounderSeatService'

const NOW = new Date('2026-08-05T12:00:00.000Z')

function tx() {
  return {
    billingSubscription: { count: mocks.subscriptionCount },
    checkoutIntent: { count: mocks.intentCount, update: mocks.intentUpdate },
    $executeRaw: mocks.executeRaw,
  } as never
}

describe('FounderSeatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.subscriptionCount.mockResolvedValue(0)
    mocks.intentCount.mockResolvedValue(0)
  })

  it('reports remaining seats from claimed subscriptions and live reservations', async () => {
    mocks.subscriptionCount.mockResolvedValue(40)
    mocks.intentCount.mockResolvedValue(3)

    await expect(FounderSeatService.snapshot(undefined, NOW)).resolves.toEqual({
      limit: 50,
      claimed: 40,
      reserved: 3,
      remaining: 7,
      soldOut: false,
    })
  })

  it('counts only nonterminal subscriptions as claimed seats', async () => {
    await FounderSeatService.snapshot(undefined, NOW)

    expect(mocks.subscriptionCount).toHaveBeenCalledWith({
      where: {
        plan: 'FOUNDER',
        status: { in: ['active', 'trialing', 'incomplete', 'past_due', 'unpaid', 'paused'] },
      },
    })
  })

  it('expires reservations older than the window instead of holding the seat forever', async () => {
    await FounderSeatService.snapshot(undefined, NOW)

    const [call] = mocks.intentCount.mock.calls
    expect(call[0].where.status).toBe('PENDING')
    expect(call[0].where.sku).toBe('FOUNDER')
    // 30 minutes before `now`.
    expect(call[0].where.updatedAt.gt).toEqual(new Date('2026-08-05T11:30:00.000Z'))
  })

  it('reports sold out once claimed and reserved seats reach the cap', async () => {
    mocks.subscriptionCount.mockResolvedValue(48)
    mocks.intentCount.mockResolvedValue(2)

    await expect(FounderSeatService.snapshot(undefined, NOW)).resolves.toMatchObject({
      remaining: 0,
      soldOut: true,
    })
  })

  it('refuses a seat when the cap is already met', async () => {
    mocks.subscriptionCount.mockResolvedValue(50)

    await expect(FounderSeatService.hasSeatAvailable(tx(), 'user_1', NOW)).resolves.toBe(false)
  })

  it('sells the last seat rather than counting the buyer against themselves', async () => {
    mocks.subscriptionCount.mockResolvedValue(49)
    // The hunter's own pending intent is excluded, so nothing is reserved here.
    mocks.intentCount.mockResolvedValue(0)

    await expect(FounderSeatService.hasSeatAvailable(tx(), 'user_1', NOW)).resolves.toBe(true)
    expect(mocks.intentCount.mock.calls[0][0].where.userId).toEqual({ not: 'user_1' })
  })

  it('takes a transaction-scoped advisory lock before any seat decision', async () => {
    await FounderSeatService.lockSeatPool(tx())

    expect(mocks.executeRaw).toHaveBeenCalledTimes(1)
    expect(mocks.executeRaw.mock.calls[0][0].join('')).toContain('pg_advisory_xact_lock')
  })

  it('extends a reservation without changing the intent status', async () => {
    await FounderSeatService.touchReservation(tx(), 'intent_1')

    expect(mocks.intentUpdate).toHaveBeenCalledWith({
      where: { id: 'intent_1' },
      data: { status: 'PENDING' },
    })
  })
})
