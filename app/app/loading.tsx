import { QuestRouteSkeleton } from '@/components/quest'

/**
 * Route-level fallback for the Battle Area, and the default fallback for any
 * `/app` segment that has not declared its own.
 *
 * Deliberately a server component: this is the first paint of the authenticated
 * app, so it ships zero client JavaScript and mounts no timers. It replaces an
 * earlier full-screen progress animation that hydrated a `setInterval` before
 * the real page had even started streaming.
 */
export default function AppLoading() {
  return (
    <QuestRouteSkeleton
      label="Entering the realm"
      rows={['h-40', { count: 4, columns: 4, height: 'h-28' }, 'h-96']}
    />
  )
}
