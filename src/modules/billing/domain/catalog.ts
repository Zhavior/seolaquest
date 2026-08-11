export type PlanCode = 'FREE' | 'FOUNDER' | 'BETA' | 'PRO' | 'AGENCY'
export type PotionId = 'minor_vial' | 'greater_elixir' | 'dragon_cauldron'

export type PlanDefinition = {
  code: PlanCode
  name: string
  priceLabel: string
  scanLimit: number
  enabled: boolean
}

export type PotionDefinition = {
  id: PotionId
  name: string
  priceCents: number
  currency: 'usd'
  quests: number
}

export const PLAN_CATALOG: Record<PlanCode, PlanDefinition> = {
  FREE: {
    code: 'FREE',
    name: 'Free Scout',
    priceLabel: '$0',
    scanLimit: 0,
    enabled: true,
  },
  FOUNDER: {
    code: 'FOUNDER',
    name: 'Founder Pass',
    // Must match the amount on the live Stripe Price this plan points at. The
    // pricing page renders this string directly, so a mismatch advertises one
    // number and charges another.
    priceLabel: '$29.99/mo — locked for life',
    scanLimit: 3_000,
    enabled: true,
  },
  BETA: {
    code: 'BETA',
    name: 'Beta Hunter',
    priceLabel: '$14.99/mo',
    // One credit buys one scan, and every product on the page has to price that
    // credit in the same universe. At 50 this tier cost $0.30 a scan while a $5
    // potion pack cost $0.005 and Founder cost $0.010 — the middle tier was 60x
    // the worst deal on the page, so a customer doing the arithmetic would buy
    // potions instead and conclude the pricing was arbitrary. 1,500 puts it at
    // $0.010, level with Founder per scan, with Founder's value being the locked
    // rate and the larger monthly allowance rather than a cheaper unit.
    scanLimit: 1_500,
    enabled: true,
  },
  PRO: {
    code: 'PRO',
    name: 'Pro Hunter',
    priceLabel: 'Coming soon',
    scanLimit: 0,
    enabled: false,
  },
  AGENCY: {
    code: 'AGENCY',
    name: 'Agency Hunter',
    priceLabel: 'Coming soon',
    scanLimit: 0,
    enabled: false,
  },
}

export const POTION_CATALOG: Record<PotionId, PotionDefinition> = {
  minor_vial: {
    id: 'minor_vial',
    name: 'Minor Mana Vial',
    priceCents: 500,
    currency: 'usd',
    quests: 1000,
  },
  greater_elixir: {
    id: 'greater_elixir',
    name: 'Greater Mana Elixir',
    priceCents: 1000,
    currency: 'usd',
    quests: 2500,
  },
  dragon_cauldron: {
    id: 'dragon_cauldron',
    name: "Dragon's Mana Cauldron",
    priceCents: 2000,
    currency: 'usd',
    quests: 6000,
  },
}

/**
 * How many Founder Pass subscriptions may ever exist at the locked rate.
 *
 * The lock is a promise to honour today's price indefinitely, so the only thing
 * bounding its cost is the seat count. It is a hard cap enforced at checkout,
 * not a marketing number — see FounderSeatService.
 */
export const FOUNDER_SEAT_LIMIT = 50

/**
 * The conditions the price lock is sold under. These are shown on the payment
 * page itself, not buried in a policy page, because they are what makes the
 * "never goes up" promise sustainable — and what a founder is agreeing to.
 */
export const FOUNDER_LOCK_TERMS = [
  'Your rate stays at the founder price for as long as the subscription stays active, even after public pricing rises.',
  'Cancelling releases the seat and the locked rate. Resubscribing later uses whatever the public price is then.',
  'The lock covers the software subscription, not usage: it includes a fixed monthly mana allowance, with top-up packs sold separately.',
] as const

export function isPlanCode(value: string): value is PlanCode {
  return Object.prototype.hasOwnProperty.call(PLAN_CATALOG, value)
}

export function isPotionId(value: string): value is PotionId {
  return Object.prototype.hasOwnProperty.call(POTION_CATALOG, value)
}

export function isPaidPlanCode(value: string): value is Exclude<PlanCode, 'FREE'> {
  return value !== 'FREE' && isPlanCode(value)
}

