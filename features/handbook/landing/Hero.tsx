import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Board, Leaf } from '../components/primitives'
import { LeadCard } from './LeadCard'

export function Hero() {
  return (
    <Board volume="start" first id="start" labelledBy="hero-title">
      <Leaf>
        <div className="hb-hero">
          <div className="hb-hero-copy hb-stack" style={{ '--gap': '1.6rem' } as React.CSSProperties}>
            <h1 id="hero-title" className="hb-display">
              Find buyers on&nbsp;X.
            </h1>
            <p className="hb-lede">
              Scan X for the problems you solve. Every match is scored for buyer intent and arrives with its source
              post, so you read before you reply.
            </p>
            <div className="hb-row">
              <Link href="/sign-up" className="hb-btn">
                Start free <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/radar" className="hb-btn hb-btn--label">
                Try the sample hunt
              </Link>
            </div>
            <p className="hb-mono hb-soft" style={{ maxWidth: '46ch' }}>
              Free Scout is $0 and saves keywords. Real scans need a paid plan. The sample needs nothing.
            </p>
          </div>
          <div className="hb-hero-ply">
            <LeadCard />
          </div>
        </div>
      </Leaf>
    </Board>
  )
}
