import 'server-only'

import { PLAN_CATALOG, type PlanCode } from '@/src/modules/billing/domain/catalog'

const PRICE_ENV_BY_PLAN: Record<Exclude<PlanCode, 'FREE'>, keyof NodeJS.ProcessEnv> = {
  FOUNDER: 'STRIPE_PRICE_FOUNDER',
  BETA: 'STRIPE_PRICE_BETA',
  PRO: 'STRIPE_PRICE_PRO',
  AGENCY: 'STRIPE_PRICE_AGENCY',
}

/**
 * The Founder Pass price lock lives in Stripe, not here: an existing subscriber
 * stays on the Price their subscription was created with, so raising the public
 * rate means publishing a *new* Price id and pointing this variable at it.
 * Never repoint an existing subscription at a new Price — that breaks the lock.
 */
export const FOUNDER_PRICE_ENV = PRICE_ENV_BY_PLAN.FOUNDER

export function founderPriceConfigured() {
  return Boolean(process.env[FOUNDER_PRICE_ENV]?.trim())
}

export function stripePriceIdForPlan(plan: Exclude<PlanCode, 'FREE'>) {
  if (!PLAN_CATALOG[plan].enabled) return null
  const value = process.env[PRICE_ENV_BY_PLAN[plan]]?.trim()
  return value || null
}

export function planCodeForStripePrice(priceId: string): PlanCode | null {
  for (const plan of ['FOUNDER', 'BETA', 'PRO', 'AGENCY'] as const) {
    const configuredPrice = process.env[PRICE_ENV_BY_PLAN[plan]]?.trim()
    if (configuredPrice && configuredPrice === priceId) return plan
  }
  return null
}

