import { DuskSigil } from '@/components/quest/QuestPending'

/**
 * First-load fallback for any route without a closer boundary: the dusk sky,
 * the ridge, and the turning compass the rest of the app uses.
 */
export default function RootLoading() {
  return (
    <div className="dq-world flex min-h-dvh w-full items-center justify-center p-4">
      <div aria-hidden="true" className="dq-ridge" />
      <div role="status" aria-live="polite" aria-atomic="true" className="dq-loader">
        <DuskSigil />
        <p className="dq-loader-title">SEOlaQuest</p>
        <p className="dq-loader-label">Loading</p>
      </div>
    </div>
  )
}
