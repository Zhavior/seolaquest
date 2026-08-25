import { QuestRoutePending } from '@/components/quest'

/**
 * Route-level fallback for the Battle Area, and the default fallback for any
 * `/app` segment that has not declared its own.
 *
 * This remains a route boundary so Next.js can partially prefetch the dynamic
 * app. It intentionally avoids drawing a fake dashboard before the real one.
 */
export default function AppLoading() {
  return <QuestRoutePending label="Opening Battle Area" />
}
