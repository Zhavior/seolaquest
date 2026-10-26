import Link from 'next/link'
import { Board, Leaf, Spread } from '../components/primitives'

/**
 * Early access, stated as a ledger of what exists. Nothing here is for sale:
 * GEO scans have no price until real scans have reported what they cost.
 */
const ROWS: Array<{ item: string; state: string; detail: string }> = [
  {
    item: 'Account',
    state: 'Free',
    detail: 'Joining costs nothing and asks for no card.',
  },
  {
    item: 'GEO scans',
    state: 'Not switched on',
    detail: 'The scan, the source sorting and the cost log are built and tested in code.',
  },
  {
    item: 'Engines',
    state: 'Perplexity',
    detail: 'One engine to start. Others are not built.',
  },
  {
    item: 'Price per scan',
    state: 'Not set',
    detail: 'Every scan records what the engine charged. Pricing waits for those numbers.',
  },
]

const LEGACY_ROW = {
  item: 'X lead finder',
  state: 'In the app',
  detail: 'The earlier SEOlaQuest product still runs inside the app for signed-in accounts.',
}

/**
 * The early-access ledger, shared by the home chapter and the pricing page.
 * Only the pricing page, where existing X plans are explained, lists the
 * earlier X lead finder.
 */
export function AccessLedger({ legacy = false }: { legacy?: boolean }) {
  const rows = legacy ? [...ROWS, LEGACY_ROW] : ROWS
  return (
    <table className="hb-ledger">
      <caption>Early access, as of this edition.</caption>
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col">State</th>
          <th scope="col">Detail</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.item}>
            <th scope="row">{row.item}</th>
            <td>{row.state}</td>
            <td>{row.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function AccessChapter() {
  return (
    <Board volume="inventory" id="inventory" labelledBy="inventory-title">
      <Leaf>
        <Spread head="Early access" headId="inventory-title" note="What exists today, and what does not.">
          <div className="hb-stack" style={{ '--gap': '2rem' } as React.CSSProperties}>
            <p className="hb-lede">Free to join. GEO scans are not on sale yet.</p>
            <AccessLedger />
            <div className="hb-row">
              <Link href="/sign-up" className="hb-btn">
                Join early access
              </Link>
              <Link href="/pricing" className="hb-btn hb-btn--label">
                Read the pricing page
              </Link>
            </div>
          </div>
        </Spread>
      </Leaf>
    </Board>
  )
}
