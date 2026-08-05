import { QuestRouteSkeleton } from '@/components/quest'

/** Guild Hall route fallback: stat wall over the leaderboard/achievement panels. */
export default function GuildLoading() {
  return (
    <QuestRouteSkeleton
      label="Guild Hall"
      rows={[
        { count: 4, columns: 4, height: 'h-32' },
        { count: 2, columns: 2, height: 'h-64' },
        'h-72',
      ]}
    />
  )
}
