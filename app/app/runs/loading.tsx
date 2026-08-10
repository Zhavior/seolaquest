import { QuestListSkeleton, QuestRouteSkeleton } from '@/components/quest'

/**
 * Route-level fallback: the full scan-run ledger shape, shown while the segment
 * streams in on navigation or first load.
 */
export default function ScanRunsLoading() {
  return (
    <QuestRouteSkeleton label="Scan Runs">
      <ScanRunListSkeleton />
    </QuestRouteSkeleton>
  )
}

/**
 * Inner fallback for the run ledger only. The page renders its own chrome
 * synchronously and suspends just this list, so the header must not repeat.
 */
export function ScanRunListSkeleton() {
  return <QuestListSkeleton count={3} height="h-52" label="Loading scan runs" />
}
