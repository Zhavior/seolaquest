import type Stripe from 'stripe'
import {
  PLAN_CATALOG,
  POTION_CATALOG,
  isPlanCode,
  isPotionId,
} from '@/src/modules/billing/domain/catalog'
import type { PlanCode } from '@/src/modules/billing/domain/catalog'

export class BillingValidationError extends Error {}

function objectId(value: string | { id: string } | null) {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

export function subscriptionIdFromInvoice(invoice: Pick<Stripe.Invoice, 'parent'>) {
  return objectId(invoice.parent?.subscription_details?.subscription ?? null)
}

export function validatePaidPlanInvoice(input: {
  invoice: Pick<Stripe.Invoice, 'amount_paid' | 'billing_reason' | 'currency' | 'customer' | 'id' | 'lines' | 'parent' | 'status'>
  subscription: Pick<Stripe.Subscription, 'customer' | 'id'>
  plan: PlanCode | null
  expectedPriceId: string | null
}) {
  if (input.invoice.status !== 'paid') throw new BillingValidationError('Invoice is not paid')
  if (input.invoice.amount_paid <= 0) return null
  if (input.invoice.billing_reason !== 'subscription_create' && input.invoice.billing_reason !== 'subscription_cycle') {
    throw new BillingValidationError('Invoice is not a subscription period invoice')
  }

  const invoiceSubscriptionId = subscriptionIdFromInvoice(input.invoice)
  if (!invoiceSubscriptionId || invoiceSubscriptionId !== input.subscription.id) {
    throw new BillingValidationError('Invoice subscription does not match')
  }

  const invoiceCustomerId = objectId(input.invoice.customer)
  const subscriptionCustomerId = objectId(input.subscription.customer)
  if (!invoiceCustomerId || invoiceCustomerId !== subscriptionCustomerId) {
    throw new BillingValidationError('Invoice customer does not match')
  }

  if (input.invoice.currency.toLowerCase() !== 'usd') {
    throw new BillingValidationError('Invoice currency does not match')
  }
  if (!input.plan || !isPlanCode(input.plan)) {
    throw new BillingValidationError('Invoice price is not a known plan')
  }
  if (!input.expectedPriceId) throw new BillingValidationError('Invoice plan price is unavailable')

  const linePriceIds = input.invoice.lines.data.map((line) => {
    const price = line.pricing?.price_details?.price
    return typeof price === 'string' ? price : price?.id ?? null
  })
  if (!linePriceIds.includes(input.expectedPriceId)) {
    throw new BillingValidationError('Invoice line price does not match the subscription plan')
  }

  const plan = PLAN_CATALOG[input.plan]
  if (!plan.enabled || input.plan === 'FREE' || plan.scanLimit <= 0) {
    throw new BillingValidationError('Invoice plan is not eligible for credits')
  }

  return { plan: input.plan, credits: plan.scanLimit }
}

export function validatePotionCheckout(input: {
  session: Stripe.Checkout.Session
  intent: {
    id: string
    userId: string
    kind: string
    sku: string
    expectedAmount: number | null
    currency: string
  }
}) {
  const { session, intent } = input
  if (intent.kind !== 'POTION' || !isPotionId(intent.sku)) throw new BillingValidationError('Invalid potion intent')

  const potion = POTION_CATALOG[intent.sku]
  const matches =
    session.mode === 'payment' &&
    session.payment_status === 'paid' &&
    session.amount_total === intent.expectedAmount &&
    session.amount_total === potion.priceCents &&
    session.currency === intent.currency &&
    session.currency === potion.currency &&
    session.client_reference_id === intent.userId &&
    session.metadata?.checkoutIntentId === intent.id &&
    session.metadata?.sku === potion.id

  if (!matches) throw new BillingValidationError('Potion Checkout did not match the persisted order')
  return potion
}
