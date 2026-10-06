import Link from 'next/link'
import { Icon } from '../artifact/IconSprite'
import { Board } from '../components/primitives'
import { QUEST_OBJECTIVES } from '@/features/auth/questSteps'

/** The closing stage: the crest, the promise, the six real setup steps, one action. */
export function RegisterChapter() {
  return (
    <Board volume="start" track={false} id="register" labelledBy="register-title">
      <div className="hb-end">
        <Icon name="crest" size={76} />
        <h2 id="register-title" className="hb-end-title">
          Register your hunter.
        </h2>
        <p className="hb-end-lede">
          Free Scout is $0. Sign-up is a six-step tutorial quest: name your hunter, say what you sell, mark who you
          are after, add your first keyword, choose X, sign the contract.
        </p>
        <ol className="hb-card-fields hb-end-steps" aria-label="Sign-up steps">
          {QUEST_OBJECTIVES.map((objective) => (
            <li key={objective.step}>{objective.title}{objective.optional ? ' (optional)' : ''}</li>
          ))}
        </ol>
        <div className="hb-ctas hb-ctas--center">
          <Link href="/sign-up" className="hb-btn">
            Start free
          </Link>
          <Link href="/radar" className="hb-btn hb-btn--label">
            Try the sample first
          </Link>
        </div>
      </div>
    </Board>
  )
}
