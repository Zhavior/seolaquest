import { QuestListSkeleton, QuestRouteSkeleton } from '@/components/quest'

/** Quest Log route fallback: the keyword-stream composer over the stream list. */
export default function KeywordsLoading() {
  return (
    <QuestRouteSkeleton label="Quest Log">
      <div className="space-y-6">
        <QuestListSkeleton count={1} height="h-32" />
        <QuestListSkeleton count={4} height="h-28" />
      </div>
    </QuestRouteSkeleton>
  )
}
