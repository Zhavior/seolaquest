import { QuestListSkeleton, QuestRouteSkeleton } from '@/components/quest'

/**
 * Route-level fallback: the full Quest Board shape, shown while the segment
 * streams in on navigation or first load.
 */
export default function QuestBoardLoading() {
  return (
    <QuestRouteSkeleton label="Quest Board">
      <QuestBoardSkeleton />
    </QuestRouteSkeleton>
  )
}

/**
 * Inner fallback for the board itself. The page renders its ticker
 * synchronously and suspends the header and cards together, because both
 * depend on the same assignment read.
 */
export function QuestBoardSkeleton() {
  return <QuestListSkeleton count={4} height="h-44" label="Loading quests" />
}
