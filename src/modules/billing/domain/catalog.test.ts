import { describe, expect, it } from 'vitest'
import { PLAN_CATALOG, POTION_CATALOG, isPaidPlanCode, isPotionId } from './catalog'

describe('billing catalog', () => {
  it('exposes only the exact beta offer as an enabled paid plan', () => {
    expect(PLAN_CATALOG.BETA).toMatchObject({
      enabled: true,
      priceLabel: '$14.99/mo',
      scanLimit: 1_500,
    })
    expect(PLAN_CATALOG.PRO.enabled).toBe(false)
    expect(PLAN_CATALOG.AGENCY.enabled).toBe(false)
  })

  it('keeps every product priced in the same per-scan universe', () => {
    // One credit buys one scan, so a subscription and a potion pack are directly
    // comparable. Beta shipped at 50 credits for $14.99 — $0.30 a scan against
    // $0.005 for the cheapest potion — which made the middle tier 60x the worst
    // value on the page. Any future edit that reopens that gap should fail here.
    const perScan = (cents: number, credits: number) => cents / 100 / credits

    const beta = perScan(1499, PLAN_CATALOG.BETA.scanLimit)
    const founder = perScan(2999, PLAN_CATALOG.FOUNDER.scanLimit)
    const cheapestPotion = Math.min(
      ...Object.values(POTION_CATALOG).map((p) => perScan(p.priceCents, p.quests))
    )

    // A subscription may cost more per scan than a bulk pack, but not by an order
    // of magnitude — that is the point at which the cheaper product cannibalises it.
    expect(beta).toBeLessThan(cheapestPotion * 10)
    expect(founder).toBeLessThan(cheapestPotion * 10)
  })

  it('states the founder rate the live Stripe Price actually charges', () => {
    // The pricing page renders priceLabel verbatim, so drift here advertises one
    // number and bills another. This one matters more than the rest: the Founder
    // Pass is sold as locked for life, and existing subscribers stay on the Price
    // they signed up with — the label and that Price must agree at sale time.
    expect(PLAN_CATALOG.FOUNDER).toMatchObject({
      enabled: true,
      priceLabel: '$29.99/mo — locked for life',
    })
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

