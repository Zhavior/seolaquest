import { QuestPending, QuestRoutePending } from '@/components/quest'

/**
 * Quiet route boundary shown while the segment streams on navigation or first
 * load.
 */
export default function ScanRunsLoading() {
  return <QuestRoutePending label="Opening Scans" />
}

/**
 * Inner fallback for the run ledger only. The page renders its own chrome
 * synchronously and suspends just this list, so the header must not repeat.
 */
export function ScanRunListSkeleton() {
  return <QuestPending label="Loading scans" />
}
