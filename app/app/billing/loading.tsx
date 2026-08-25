import { QuestRoutePending } from '@/components/quest'

/**
 * Lightweight route boundary keeps partial prefetching without flashing a
 * placeholder billing dashboard.
 */
export default function BillingLoading() {
  return <QuestRoutePending label="Opening Billing" />
}
