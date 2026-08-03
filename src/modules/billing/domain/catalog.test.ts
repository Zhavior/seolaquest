import { describe, expect, it } from 'vitest'
import { PLAN_CATALOG, POTION_CATALOG, isPaidPlanCode, isPotionId } from './catalog'

describe('billing catalog', () => {
  it('exposes only the exact beta offer as an enabled paid plan', () => {
    expect(PLAN_CATALOG.BETA).toMatchObject({
      enabled: true,
      priceLabel: '$14.99/mo',
      scanLimit: 50,
    })
    expect(PLAN_CATALOG.PRO.enabled).toBe(false)
    expect(PLAN_CATALOG.AGENCY.enabled).toBe(false)
  })

  it('rejects free, disabled aliases, and arbitrary paid plan input', () => {
    expect(isPaidPlanCode('BETA')).toBe(true)
    expect(isPaidPlanCode('FREE')).toBe(false)
    expect(isPaidPlanCode('DRAGON_SLAYER')).toBe(false)
  })

  it('keeps potion identifiers, price, and credit grants server-owned', () => {
    expect(POTION_CATALOG.minor_vial).toMatchObject({ priceCents: 500, quests: 1000, currency: 'usd' })
    expect(POTION_CATALOG.greater_elixir).toMatchObject({ priceCents: 1000, quests: 2500, currency: 'usd' })
    expect(POTION_CATALOG.dragon_cauldron).toMatchObject({ priceCents: 2000, quests: 6000, currency: 'usd' })
    expect(isPotionId('minor_vial')).toBe(true)
    expect(isPotionId('minor')).toBe(false)
  })
})

