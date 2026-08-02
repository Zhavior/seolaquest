export type PlanCode = 'FREE' | 'BETA' | 'PRO' | 'AGENCY'
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
  BETA: {
    code: 'BETA',
    name: 'Beta Hunter',
    priceLabel: '$14.99/mo',
    scanLimit: 50,
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

export function isPlanCode(value: string): value is PlanCode {
  return Object.prototype.hasOwnProperty.call(PLAN_CATALOG, value)
}

export function isPotionId(value: string): value is PotionId {
  return Object.prototype.hasOwnProperty.call(POTION_CATALOG, value)
}

export function isPaidPlanCode(value: string): value is Exclude<PlanCode, 'FREE'> {
  return value !== 'FREE' && isPlanCode(value)
}

