import 'server-only'

import { PLAN_CATALOG, type PlanCode } from '@/src/modules/billing/domain/catalog'

const PRICE_ENV_BY_PLAN: Record<Exclude<PlanCode, 'FREE'>, keyof NodeJS.ProcessEnv> = {
  BETA: 'STRIPE_PRICE_BETA',
  PRO: 'STRIPE_PRICE_PRO',
  AGENCY: 'STRIPE_PRICE_AGENCY',
}

export function stripePriceIdForPlan(plan: Exclude<PlanCode, 'FREE'>) {
  if (!PLAN_CATALOG[plan].enabled) return null
  const value = process.env[PRICE_ENV_BY_PLAN[plan]]?.trim()
  return value || null
}

export function planCodeForStripePrice(priceId: string): PlanCode | null {
  for (const plan of ['BETA', 'PRO', 'AGENCY'] as const) {
    const configuredPrice = process.env[PRICE_ENV_BY_PLAN[plan]]?.trim()
    if (configuredPrice && configuredPrice === priceId) return plan
  }
  return null
}

