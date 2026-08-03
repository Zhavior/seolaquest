import 'server-only'

import { logger } from '@/src/modules/core/infrastructure/logger'

export const BILLING_EVENTS = {
  pricingViewed: 'billing_pricing_viewed',
  billingViewed: 'billing_account_viewed',
  checkoutStartRequested: 'billing_checkout_start_requested',
  checkoutOpened: 'billing_checkout_opened',
  checkoutBlocked: 'billing_checkout_blocked',
  checkoutFailed: 'billing_checkout_failed',
  checkoutReturnPending: 'billing_checkout_return_pending',
  checkoutReturnCancelled: 'billing_checkout_return_cancelled',
  activationVerified: 'billing_activation_verified',
  portalOpened: 'billing_portal_opened',
  portalFailed: 'billing_portal_failed',
} as const

export type BillingEventName = (typeof BILLING_EVENTS)[keyof typeof BILLING_EVENTS]

type BillingEvent = {
  name: BillingEventName
  surface: 'pricing' | 'billing' | 'checkout' | 'portal'
  outcome?: 'allowed' | 'blocked' | 'failed' | 'opened' | 'pending' | 'cancelled' | 'verified'
  plan?: string
  accountState?: string
}

/** Uses the existing structured logger; it never sends a browser analytics request. */
export function recordBillingEvent(event: BillingEvent) {
  logger.info({ billingEvent: event }, event.name)
}
