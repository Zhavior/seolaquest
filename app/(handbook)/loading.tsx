/** A page turning: the half-hinged leaf is the handbook's pending state. */
export default function PublicLoading() {
  return (
    <div className="hb-board hb-board--first" role="status" aria-live="polite">
      <div className="hb-leaf" style={{ minHeight: '18rem' }}>
        <p className="hb-mono">Turning the page…</p>
      </div>
    </div>
  )
}
