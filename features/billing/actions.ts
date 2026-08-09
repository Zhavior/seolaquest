'use server'

import {
  withServerAction,
  type ServerActionFailure,
} from '@/src/modules/core/infrastructure/server-action'

import { BILLING_EVENTS, recordBillingEvent } from './analytics'

type ActionResult = { ok: boolean; message?: string }

/**
 * Keeps the failure envelope's shape exactly as the wrapper produces it — `{ ok: false,
 * code, message }` — and only restores the reassurance every other rejection in this file
 * already carries.
 *
 * It is needed because the paths that reach this translator are the ones that used to
 * *throw*: `requireCurrentUser()` raises a bare `Error('Unauthorized')` for a signed-out
 * caller, and `RateLimiterService.enforce` raises `RateLimitError`. Before wrapping, the
 * client's own catch supplied "Checkout is unavailable. No charge was made."; without this
 * the same user would now read the generic "Something went wrong." on a spend-bearing
 * button, which is the one place a vague message costs trust.
 *
 * The claim is true by construction on both actions below: creating a Stripe Checkout
 * Session bills nothing (the charge happens on Stripe's hosted page, which the user only
 * reaches via a returned `url`), so a throw before that return means no payment was
 * attempted. Not applied to the portal action, which is not a charge surface.
 */
function withNoChargeAssurance(failure: ServerActionFailure): ServerActionFailure {
  if (failure.message.includes('No charge')) return failure
  return { ...failure, message: `${failure.message} No charge was made.` }
}

/**
 * Checkout, top-up and portal all start a Stripe session, so they take the `billing` tier
 * (10/min, hashed identifier). `getBillingStateAction` does not, and says why at its own
 * definition.
 *
 * None of these actions calls `redirect()`: the hand-off to Stripe is a `url` returned to
 * the client, which navigates with `window.location.assign`. So the Stripe hop never
 * depends on a thrown redirect signal surviving a catch. `withServerAction` rethrows those
 * signals first regardless, and nothing below adds a catch in front of it.
 *
 * The failure envelope stays the wrapper's `ServerActionFailure`, which is already
 * `{ ok: false, message }` — the shape every caller here reads.
 */
export const createCheckoutAction = withServerAction(
  { name: 'createCheckoutAction', tier: 'billing', onError: withNoChargeAssurance },
  async (plan: string): Promise<ActionResult & { url?: string }> => {
    const { PLAN_CATALOG, isPaidPlanCode } = await import('@/src/modules/billing/domain/catalog')
    if (!isPaidPlanCode(plan)) return { ok: false, message: 'Invalid plan.' }
    if (!PLAN_CATALOG[plan].enabled) return { ok: false, message: 'That plan is not available yet.' }

    recordBillingEvent({
      name: BILLING_EVENTS.checkoutStartRequested,
      surface: 'checkout',
      plan,
    })
    if (
      process.env.ENABLE_BETA_CHECKOUT !== 'true'
      || process.env.SUBSCRIPTION_CHECKOUT_ENABLED !== 'true'
      || process.env.ENABLE_SCAN_WORKER !== 'true'
      || process.env.DURABLE_WORKER_ENABLED !== 'true'
    ) {
      recordBillingEvent({
        name: BILLING_EVENTS.checkoutBlocked,
        surface: 'checkout',
        outcome: 'blocked',
        plan,
      })
      return {
        ok: false,
        message: 'Subscription checkout is paused. No charge was made.',
      }
    }

    const { buildBillingViewModel } = await import('./viewModel')
    const billing = await buildBillingViewModel()
    if (
      billing.status === 'loading'
      || billing.status === 'unavailable'
      || billing.availability.checkout.state !== 'available'
    ) {
      recordBillingEvent({
        name: BILLING_EVENTS.checkoutBlocked,
        surface: 'checkout',
        outcome: 'blocked',
        plan,
      })
      return {
        ok: false,
        message: billing.status === 'loading' || billing.status === 'unavailable'
          ? 'Checkout readiness could not be verified. No charge was made.'
          : `${billing.availability.checkout.label}. No charge was made.`,
      }
    }

    const { BillingService } = await import('@/src/modules/billing/application/BillingService')
    const result = await BillingService.createCheckout(plan)
    recordBillingEvent({
      name: result.ok && result.url ? BILLING_EVENTS.checkoutOpened : BILLING_EVENTS.checkoutFailed,
      surface: 'checkout',
      outcome: result.ok && result.url ? 'opened' : 'failed',
      plan,
    })
    return result
  },
)

export const createManaCheckoutAction = withServerAction(
  { name: 'createManaCheckoutAction', tier: 'billing', onError: withNoChargeAssurance },
  async (potionId: string): Promise<ActionResult & { url?: string }> => {
    const { BillingService } = await import('@/src/modules/billing/application/BillingService')
    return BillingService.createManaCheckout(potionId)
  },
)

export const createBillingPortalAction = withServerAction(
  { name: 'createBillingPortalAction', tier: 'billing' },
  async (): Promise<ActionResult & { url?: string }> => {
    const { BillingService } = await import('@/src/modules/billing/application/BillingService')
    const result = await BillingService.createPortal()
    recordBillingEvent({
      name: result.ok && result.url ? BILLING_EVENTS.portalOpened : BILLING_EVENTS.portalFailed,
      surface: 'portal',
      outcome: result.ok && result.url ? 'opened' : 'failed',
    })
    return result
  },
)

/**
 * `global`, not `billing`, and deliberately so. This is a read-only projection of the
 * server-owned view model with no Stripe call and no spend behind it, and it runs on mount
 * of the credit modal. Putting a mount-time read in the 10/min `billing` bucket would let
 * a user who opens and closes that modal a few times exhaust the budget that exists to
 * protect the actions that can actually charge them.
 *
 * `onError: 'rethrow'` because this action returns raw domain data, not an envelope: it
 * already signals failure by throwing, and its only caller (components/ManaShopModal.tsx)
 * reads the fields straight off the resolved value inside a `.then()` with a `.catch()`.
 * Returning a `ServerActionFailure` here would be a type error at that call site and would
 * silently populate the modal with `undefined` balances.
 */
export const getBillingStateAction = withServerAction(
  { name: 'getBillingStateAction', tier: 'global', onError: 'rethrow' },
  async () => {
    const { buildBillingViewModel } = await import('./viewModel')
    const billing = await buildBillingViewModel()
    if (billing.status === 'loading' || billing.status === 'unavailable') {
      throw new Error('Billing state is unavailable')
    }

    // Compatibility projection for the existing global credit modal. The
    // server-owned view model remains the single source of billing truth.
    return {
      plan: billing.subscription.plan,
      planName: billing.subscription.planName,
      subscriptionStatus: billing.subscription.providerStatus,
      paid: billing.subscription.paid,
      scanLimit: billing.catalog.find((plan) => plan.code === billing.subscription.plan)?.scanLimit ?? 0,
      questsRemaining: billing.credits.balance,
      maxCredits: billing.credits.highestRecordedBalance,
      subscriptionCheckoutEnabled: billing.availability.checkout.state === 'available',
      potionCheckoutEnabled: billing.availability.creditTopUps.state === 'available',
    }
  },
)
