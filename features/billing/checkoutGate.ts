/**
 * Whether paid checkout is switched on, for public pages that must not promise
 * a purchase that cannot complete.
 *
 * This reads the same four environment switches as the billing service's own
 * release gate (BillingService.subscriptionCheckoutReleaseGateOpen). It is a
 * necessary condition, not a sufficient one: the service also verifies a fresh
 * worker heartbeat and Stripe configuration at the moment of payment. So `true`
 * means "not paused by configuration", and copy built on it must not say more
 * than that. `false` is definitive. features/handbook/contract.test.ts fails if
 * the service stops using these names.
 */
export function isPaidCheckoutOpen(env: Record<string, string | undefined> = process.env): boolean {
  return (
    env.ENABLE_BETA_CHECKOUT === 'true' &&
    env.SUBSCRIPTION_CHECKOUT_ENABLED === 'true' &&
    env.ENABLE_SCAN_WORKER === 'true' &&
    env.DURABLE_WORKER_ENABLED === 'true'
  )
}

/** Mana top-up packs are gated by their own switch, separate from subscriptions. */
export function isPotionCheckoutOpen(env: Record<string, string | undefined> = process.env): boolean {
  return env.POTION_CHECKOUT_ENABLED === 'true'
}
