import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Board } from '../components/primitives'

/**
 * The closing action as the manual's tear-off registration card: cut line,
 * punch holes, and the six real onboarding steps as its printed fields.
 */
export function RegisterChapter() {
  return (
    <Board volume="start" track={false} id="register" labelledBy="register-title">
      <div className="hb-card">
        <div className="hb-card-body">
          <h2 id="register-title" className="hb-card-title">
            Register your hunter.
          </h2>
          <p className="hb-lede">
            Free Scout is $0. Sign-up is a six-step tutorial quest: name your hunter, say what you sell, mark who you
            are after, add your first keyword, choose X, sign the contract.
          </p>
          <div className="hb-row">
            <Link href="/sign-up" className="hb-btn">
              Start free <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/radar" className="hb-btn hb-btn--label">
              Try the sample first
            </Link>
          </div>
        </div>
        <ol className="hb-card-fields hb-mono" aria-label="Sign-up steps">
          <li>Name your hunter</li>
          <li>Declare your trade (optional)</li>
          <li>Mark your quarry (optional)</li>
          <li>Equip your first keyword</li>
          <li>Choose your hunting ground</li>
          <li>Sign the contract</li>
        </ol>
      </div>
    </Board>
  )
}
