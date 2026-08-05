import type { Metadata } from 'next'
import { Suspense } from 'react'

import { BILLING_EVENTS, recordBillingEvent } from '@/features/billing/analytics'
import { BillingPageClient } from '@/features/billing/components/BillingPageClient'
import { buildBillingViewModel } from '@/features/billing/viewModel'
import { isPlanCode, type PlanCode } from '@/src/modules/billing/domain/catalog'
import BillingLoading from './loading'

export const metadata: Metadata = {
  title: 'Billing | SEO la Quest',
  description: 'Server-verified SEO la Quest subscription, credits, scan eligibility, and billing availability.',
}

type BillingPageProps = {
  searchParams: Promise<{
    checkout?: string | string[]
    session_id?: string | string[]
    offer?: string | string[]
  }>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

/**
 * `?offer=…` only chooses which card to scroll to and ring. It is deliberately
 * validated against the catalog rather than passed through, so a crafted link
 * cannot inject an arbitrary value into the grid.
 */
function highlightedPlan(value: string | string[] | undefined): PlanCode | null {
  const offer = firstValue(value)?.trim().toUpperCase()
  return offer && isPlanCode(offer) ? offer : null
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const query = await searchParams
  
  // We do NOT await here. We pass the promise directly to the client component.
  const modelPromise = buildBillingViewModel({
    checkout: firstValue(query.checkout),
    sessionId: firstValue(query.session_id),
  }).then(model => {
    // Analytics side-effects after it resolves
    recordBillingEvent({
      name: BILLING_EVENTS.billingViewed,
      surface: 'billing',
      accountState: model.status,
    })
    if (model.status !== 'loading' && model.status !== 'unavailable') {
      if (model.checkoutReturn.state === 'pending' || model.checkoutReturn.state === 'unmatched') {
        recordBillingEvent({
          name: BILLING_EVENTS.checkoutReturnPending,
          surface: 'billing',
          outcome: 'pending',
          accountState: model.status,
        })
      }
      if (model.checkoutReturn.state === 'cancelled') {
        recordBillingEvent({
          name: BILLING_EVENTS.checkoutReturnCancelled,
          surface: 'billing',
          outcome: 'cancelled',
          accountState: model.status,
        })
      }
      if (model.checkoutReturn.state === 'verified') {
        recordBillingEvent({
          name: BILLING_EVENTS.activationVerified,
          surface: 'billing',
          outcome: 'verified',
          plan: model.subscription.plan,
          accountState: model.status,
        })
      }
    }
    return model
  })

  // We wrap in Suspense. We can use the existing loading.tsx component as the fallback.
  return (
    <Suspense fallback={<BillingLoading />}>
      <BillingPageClient modelPromise={modelPromise} highlightPlan={highlightedPlan(query.offer)} />
    </Suspense>
  )
}
