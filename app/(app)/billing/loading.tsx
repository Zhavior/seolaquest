import { BillingPageClient } from '@/features/billing/components/BillingPageClient'
import { BILLING_LOADING_VIEW_MODEL } from '@/features/billing/viewModel'

export default function BillingLoading() {
  return <BillingPageClient model={BILLING_LOADING_VIEW_MODEL} />
}
