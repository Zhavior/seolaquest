import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HandbookPage } from '@/features/handbook/components/primitives'

/**
 * Body of the post-sign-up page. Every statement must stay true: no date, no
 * email promise, no price. The checkout line follows the real checkout switch.
 */
export function EarlyAccessWelcome({ checkoutOpen, setupStarted }: { checkoutOpen: boolean; setupStarted: boolean }) {
  return (
    <HandbookPage volume="start" title="You're on the early-access list" note="Free. No card.">
      <div className="hb-stack" style={{ '--gap': '2rem' } as React.CSSProperties}>
        <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
          <h2 className="hb-display hb-display--post">Citation scans are not switched on yet</h2>
          <p className="hb-lede">
            A scan will ask an AI search engine the question your buyers ask, list every site the answer cites, and show
            whether yours is one of them.
          </p>
          <p className="hb-prose">
            We will switch scans on in this account once they have run for real and we know what each one costs. There is
            no date yet. You do not need to do anything; your account is saved.
          </p>
          <div className="hb-row">
            <Link href="/radar" className="hb-btn">
              See what a scan will show <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <p className="hb-mono hb-soft">The sample uses invented sites. No engine is asked.</p>
        </div>

        <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
          <h2 className="hb-display hb-display--post">While you wait: the X lead finder</h2>
          <p className="hb-prose">
            SEOlaQuest also has a tool that finds posts on X from people asking for what you sell. You can set it up now
            in six short steps and try it on sample leads. Running real scans on X needs a paid plan
            {checkoutOpen ? (
              <>
                {' '}
                (see <Link href="/pricing" className="hb-link">pricing</Link>).
              </>
            ) : (
              ', and paid plans are not on sale yet.'
            )}
          </p>
          <div className="hb-row">
            <Link href="/onboarding" className="hb-btn hb-btn--label">
              {setupStarted ? 'Continue setting up the X lead finder' : 'Set up the X lead finder'}
            </Link>
          </div>
        </div>
      </div>
    </HandbookPage>
  )
}
