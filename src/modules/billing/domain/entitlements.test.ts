import { describe, expect, it } from 'vitest'
import { isCurrentPaidSubscription } from './entitlements'

const now = new Date('2026-07-30T00:00:00.000Z')

describe('paid entitlement snapshot', () => {
  it('accepts an enabled active Beta period that has not expired', () => {
    expect(isCurrentPaidSubscription({
      plan: 'BETA',
      status: 'active',
      currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z'),
    }, now)).toBe(true)
  })

  it.each([
    ['expired period', { plan: 'BETA', status: 'active', currentPeriodEnd: new Date('2026-07-29T23:59:59.000Z') }],
    ['missing period', { plan: 'BETA', status: 'active', currentPeriodEnd: null }],
    ['past due', { plan: 'BETA', status: 'past_due', currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z') }],
    ['disabled plan', { plan: 'PRO', status: 'active', currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z') }],
    ['unknown plan', { plan: 'ENTERPRISE', status: 'active', currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z') }],
  ])('fails closed for %s', (_label, snapshot) => {
    expect(isCurrentPaidSubscription(snapshot, now)).toBe(false)
  })
})
