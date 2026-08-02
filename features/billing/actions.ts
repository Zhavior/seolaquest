'use server'

import { BILLING_EVENTS, recordBillingEvent } from './analytics'

type ActionResult = { ok: boolean; message?: string }

export async function createCheckoutAction(plan: string): Promise<ActionResult & { url?: string }> {
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
}

export async function createManaCheckoutAction(potionId: string): Promise<ActionResult & { url?: string }> {
  const { BillingService } = await import('@/src/modules/billing/application/BillingService')
  return BillingService.createManaCheckout(potionId)
}

export async function createBillingPortalAction(): Promise<ActionResult & { url?: string }> {
  const { BillingService } = await import('@/src/modules/billing/application/BillingService')
  const result = await BillingService.createPortal()
  recordBillingEvent({
    name: result.ok && result.url ? BILLING_EVENTS.portalOpened : BILLING_EVENTS.portalFailed,
    surface: 'portal',
    outcome: result.ok && result.url ? 'opened' : 'failed',
  })
  return result
}

export async function getBillingStateAction() {
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
}
