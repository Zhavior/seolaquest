import type { Metadata } from 'next'

import { BILLING_EVENTS, recordBillingEvent } from '@/features/billing/analytics'
import { BillingPageClient } from '@/features/billing/components/BillingPageClient'
import { buildBillingViewModel } from '@/features/billing/viewModel'

export const metadata: Metadata = {
  title: 'Billing | CoQuest',
  description: 'Server-verified CoQuest subscription, credits, scan eligibility, and billing availability.',
}

type BillingPageProps = {
  searchParams: Promise<{
    checkout?: string | string[]
    session_id?: string | string[]
  }>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const query = await searchParams
  const model = await buildBillingViewModel({
    checkout: firstValue(query.checkout),
    sessionId: firstValue(query.session_id),
  })

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

  return <BillingPageClient model={model} />
}
