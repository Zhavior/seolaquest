import Link from 'next/link'
import { Icon } from '../artifact/IconSprite'
import { Board } from '../components/primitives'

/** The closing stage: the crest, the promise, what joining actually does, one action. */
export function RegisterChapter() {
  return (
    <Board volume="start" track={false} id="register" labelledBy="register-title">
      <div className="hb-end">
        <Icon name="crest" size={76} />
        <h2 id="register-title" className="hb-end-title">
          Join the early access.
        </h2>
        <p className="hb-end-lede">
          Free, and no card. Your account opens today&apos;s app, the X lead finder, and GEO scans are planned to switch
          on in the same account once they have run for real.
        </p>
        <ol className="hb-card-fields hb-end-steps" aria-label="What joining does">
          <li>Create a free account</li>
          <li>Set up your workspace</li>
          <li>Get GEO scans when they switch on</li>
        </ol>
        <div className="hb-ctas hb-ctas--center">
          <Link href="/sign-up" className="hb-btn">
            Join early access
          </Link>
          <Link href="/radar" className="hb-btn hb-btn--label">
            See the sample scan first
          </Link>
        </div>
      </div>
    </Board>
  )
}
