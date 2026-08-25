import { QuestPending, QuestRoutePending } from '@/components/quest'

/** Quiet route boundary used while Campaign Broadcast streams. */
export default function DeliveriesLoading() {
  return <QuestRoutePending label="Opening Campaign Broadcast" />
}

/**
 * Inner fallback for the dispatch ledger only — the page already renders its
 * own chrome synchronously.
 */
export function DeliveryListSkeleton() {
  return <QuestPending label="Loading CRM deliveries" />
}
