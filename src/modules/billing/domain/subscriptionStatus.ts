/**
 * Stripe subscription statuses that still tie up the account.
 *
 * A subscription in any of these states either bills today or may yet start
 * billing, so it blocks a second checkout and — for the Founder Pass — holds a
 * seat. Anything outside this set (`canceled`, `incomplete_expired`) has
 * released the account.
 */
export const NONTERMINAL_SUBSCRIPTION_STATUSES = [
  'active',
  'trialing',
  'incomplete',
  'past_due',
  'unpaid',
  'paused',
] as const

const NONTERMINAL_SET: ReadonlySet<string> = new Set(NONTERMINAL_SUBSCRIPTION_STATUSES)

export function isNonterminalSubscriptionStatus(status: string) {
  return NONTERMINAL_SET.has(status)
}
