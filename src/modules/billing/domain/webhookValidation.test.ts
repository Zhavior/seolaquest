import type Stripe from 'stripe'
import { describe, expect, it } from 'vitest'
import {
  BillingValidationError,
  validatePaidPlanInvoice,
  validatePotionCheckout,
} from './webhookValidation'

function paidSession(overrides: Partial<Stripe.Checkout.Session> = {}) {
  return {
    id: 'cs_topup_1',
    mode: 'payment',
    payment_status: 'paid',
    amount_total: 500,
    currency: 'usd',
    client_reference_id: 'user_1',
    metadata: {
      checkoutIntentId: 'intent_1',
      sku: 'minor_vial',
    },
    ...overrides,
  } as Stripe.Checkout.Session
}

const intent = {
  id: 'intent_1',
  userId: 'user_1',
  kind: 'POTION',
  sku: 'minor_vial',
  expectedAmount: 500,
  currency: 'usd',
}

describe('potion webhook validation', () => {
  it('accepts a paid Checkout that exactly matches its persisted intent', () => {
    expect(validatePotionCheckout({ session: paidSession(), intent })).toMatchObject({
      id: 'minor_vial',
      quests: 1000,
    })
  })

  it.each([
    ['unpaid payment', { payment_status: 'unpaid' }],
    ['wrong mode', { mode: 'subscription' }],
    ['wrong amount', { amount_total: 100 }],
    ['wrong currency', { currency: 'cad' }],
    ['wrong owner', { client_reference_id: 'user_2' }],
    ['wrong intent', { metadata: { checkoutIntentId: 'intent_2', sku: 'minor_vial' } }],
    ['wrong sku', { metadata: { checkoutIntentId: 'intent_1', sku: 'dragon_cauldron' } }],
  ])('rejects %s', (_label, overrides) => {
    expect(() => validatePotionCheckout({
      session: paidSession(overrides as Partial<Stripe.Checkout.Session>),
      intent,
    })).toThrow(BillingValidationError)
  })
})

function paidInvoice(overrides: Partial<Stripe.Invoice> = {}) {
  return {
    id: 'in_renewal_1',
    status: 'paid',
    amount_paid: 1499,
    billing_reason: 'subscription_cycle',
    currency: 'usd',
    customer: 'cus_1',
    parent: {
      type: 'subscription_details',
      quote_details: null,
      subscription_details: { subscription: 'sub_1', metadata: {} },
    },
    lines: {
      data: [{
        pricing: {
          type: 'price_details',
          unit_amount_decimal: '1499',
          price_details: { price: 'price_beta', product: 'prod_beta' },
        },
      }],
    },
    ...overrides,
  } as Stripe.Invoice
}

const subscription = { id: 'sub_1', customer: 'cus_1' } as Stripe.Subscription

function validateInvoice(invoice: Stripe.Invoice, plan: 'BETA' | null = 'BETA', expectedPriceId = 'price_beta') {
  return validatePaidPlanInvoice({ invoice, subscription, plan, expectedPriceId })
}

describe('paid plan invoice validation', () => {
  it.each(['subscription_create', 'subscription_cycle'] as const)(
    'allocates 50 scans for an eligible %s invoice',
    (billingReason) => {
      expect(validateInvoice(paidInvoice({ billing_reason: billingReason }))).toEqual({
        plan: 'BETA',
        credits: 50,
      })
    },
  )

  it('records a zero-dollar invoice without granting scans', () => {
    expect(validateInvoice(paidInvoice({ amount_paid: 0 }))).toBeNull()
  })

  it.each([
    ['unpaid', { status: 'open' }],
    ['subscription update', { billing_reason: 'subscription_update' }],
    ['manual invoice', { billing_reason: 'manual' }],
    ['wrong customer', { customer: 'cus_other' }],
    ['wrong currency', { currency: 'cad' }],
    ['wrong subscription', {
      parent: {
        type: 'subscription_details',
        quote_details: null,
        subscription_details: { subscription: 'sub_other', metadata: {} },
      },
    }],
    ['wrong line price', {
      lines: {
        data: [{
          pricing: {
            type: 'price_details',
            unit_amount_decimal: '1499',
            price_details: { price: 'price_other', product: 'prod_other' },
          },
        }],
      },
    }],
  ])('rejects %s', (_label, overrides) => {
    expect(() => validateInvoice(paidInvoice(overrides as Partial<Stripe.Invoice>))).toThrow(BillingValidationError)
  })

  it('rejects an unknown or disabled plan', () => {
    expect(() => validateInvoice(paidInvoice(), null)).toThrow(BillingValidationError)
    expect(() => validatePaidPlanInvoice({
      invoice: paidInvoice(),
      subscription,
      plan: 'PRO',
      expectedPriceId: 'price_beta',
    })).toThrow(BillingValidationError)
  })
})
