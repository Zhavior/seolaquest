import { QuestRouteSkeleton } from '@/components/quest'

/**
 * Billing route fallback. Previously used soft rounded shimmer bars, which read
 * as a different product than the rest of the app — this now matches the Guild
 * Hall surface (thick borders, flat offset shadows, square corners).
 */
export default function BillingLoading() {
  return (
    <QuestRouteSkeleton
      label="Billing"
      rows={['h-24', { count: 3, columns: 3, height: 'h-56' }, 'h-32']}
    />
  )
}
