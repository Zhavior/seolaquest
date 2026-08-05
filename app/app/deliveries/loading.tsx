import { QuestListSkeleton, QuestRouteSkeleton } from '@/components/quest'

/** Route-level fallback: the full Campaign Broadcast shape. */
export default function DeliveriesLoading() {
  return (
    <QuestRouteSkeleton label="Campaign Broadcast">
      <DeliveryListSkeleton />
    </QuestRouteSkeleton>
  )
}

/**
 * Inner fallback for the dispatch ledger only — the page already renders its
 * own chrome synchronously.
 */
export function DeliveryListSkeleton() {
  return <QuestListSkeleton count={3} height="h-36" label="Loading CRM deliveries" />
}
