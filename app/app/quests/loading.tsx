import { QuestPending, QuestRoutePending } from '@/components/quest'

/**
 * Quiet route boundary shown while the segment streams on navigation or first
 * load.
 */
export default function QuestBoardLoading() {
  return <QuestRoutePending label="Opening Quest Board" />
}

/**
 * Inner fallback for the board itself. The page renders its ticker
 * synchronously and suspends the header and cards together, because both
 * depend on the same assignment read.
 */
export function QuestBoardSkeleton() {
  return <QuestPending label="Loading quests" />
}
