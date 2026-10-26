import { DuskSigil } from '@/components/quest/QuestPending'

/** The public site's pending state: the same turning compass as the app. */
export default function PublicLoading() {
  return (
    <div className="hb-board hb-board--first" role="status" aria-live="polite" aria-atomic="true">
      <div className="dq-loader" style={{ minHeight: '18rem', justifyContent: 'center' }}>
        <DuskSigil />
        <p className="dq-loader-label">Turning the page…</p>
      </div>
    </div>
  )
}
