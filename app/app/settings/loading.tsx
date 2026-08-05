import { QuestRouteSkeleton } from '@/components/quest'

/** Basecamp Settings route fallback: stacked configuration scrolls. */
export default function SettingsLoading() {
  return <QuestRouteSkeleton label="Basecamp Settings" rows={['h-40', 'h-56', 'h-56', 'h-32']} />
}
