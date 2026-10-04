import Link from 'next/link'
import { Board, Leaf, Spread } from '../components/primitives'
import { FAQ, errataItems } from './errata'

export function ErrataList({ checkoutOpen }: { checkoutOpen: boolean }) {
  return (
    <ul className="hb-errata">
      {errataItems(checkoutOpen).map((item) => (
        <li key={item.id}>
          {item.kind === 'open' ? (
            <span className="hb-slip">OPEN</span>
          ) : (
            <span className="hb-tag hb-tag--slip">BY DESIGN</span>
          )}
          <p>{item.text}</p>
        </li>
      ))}
    </ul>
  )
}

export function FaqList() {
  return (
    <dl className="hb-faq">
      {FAQ.map((item) => (
        <div key={item.q}>
          <dt className="hb-h3">{item.q}</dt>
          <dd className="hb-prose">{item.a}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ErrataChapter({ checkoutOpen }: { checkoutOpen: boolean }) {
  return (
    <Board volume="errata" id="errata" labelledBy="errata-title">
      <Leaf>
        <Spread
          head="Errata"
          headId="errata-title"
          note="What this edition does not do yet. Named here so you do not find out later."
        >
          <div className="hb-stack" style={{ '--gap': '2.5rem' } as React.CSSProperties}>
            <p className="hb-lede">Known issues in this edition.</p>
            <ErrataList checkoutOpen={checkoutOpen} />
            <div className="hb-stack" style={{ '--gap': '1.25rem' } as React.CSSProperties}>
              <h3 className="hb-h3">Before you ask</h3>
              <FaqList />
            </div>
            <p>
              <Link href="/status" className="hb-link">
                See what is verified and what is pending
              </Link>
            </p>
          </div>
        </Spread>
      </Leaf>
    </Board>
  )
}
