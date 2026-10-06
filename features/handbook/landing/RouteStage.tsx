import Link from 'next/link'
import { PlateIcon, type IconName } from '../artifact/IconSprite'
import { Board, Leaf, Spread } from '../components/primitives'
import { AURORA_ENGAGE_MIN, AURORA_IGNORE_BELOW, CLAIM_MIN_SCORE, CLAIM_XP } from '../rules'

const STOPS: Array<{ numeral: string; key: string; icon: IconName; label: string; hot?: boolean; body: string }> = [
  {
    numeral: 'I',
    key: 'Scan',
    icon: 'spyglass',
    label: 'Scan: spyglass',
    body: 'Search X for the keywords you track. One scan costs 1 mana. Scanning needs a paid plan, and it pays no XP.',
  },
  {
    numeral: 'II',
    key: 'Review',
    icon: 'eye',
    label: 'Review: all-seeing eye',
    body: `Open the source post. Aurora scores it 0 to 100 for buyer intent: Engage ${AURORA_ENGAGE_MIN}+, Watch ${AURORA_IGNORE_BELOW} to ${AURORA_ENGAGE_MIN - 1}, Ignore under ${AURORA_IGNORE_BELOW}. A policy line, not a chance of a sale.`,
  },
  {
    numeral: 'III',
    key: 'Claim',
    icon: 'chest',
    label: 'Claim: treasure chest',
    hot: true,
    body: `Save the lead for follow-up. It pays ${CLAIM_XP} XP when the score is ${CLAIM_MIN_SCORE} or more. Claiming does not mean you contacted anyone.`,
  },
  {
    numeral: 'IV',
    key: 'Follow up',
    icon: 'sword',
    label: 'Follow up: crossed swords',
    body: 'On paid plans: draft a reply with AI, export the lead to your CRM by webhook, and log what happened. SEOlaQuest does not post to X for you, and logged replies or sales earn no XP.',
  },
]

/** The route: four verbs, each on an engraved plate. */
export function RouteStage() {
  return (
    <Board volume="hunt" id="route" labelledBy="route-title">
      <Leaf>
        <Spread head="Four verbs. One lead." headId="route-title" note="Costs and payouts here are the product's real ones.">
          <div className="hb-stack" style={{ '--gap': '1.5rem' } as React.CSSProperties}>
            <ol className="hb-stops">
              {STOPS.map((stop) => (
                <li key={stop.key} className={stop.hot ? 'hb-stop hb-stop--hot' : 'hb-stop'}>
                  <PlateIcon name={stop.icon} label={stop.label} />
                  <h3>
                    {stop.numeral} · {stop.key}
                  </h3>
                  <p>{stop.body}</p>
                </li>
              ))}
            </ol>
            <p className="hb-prose">
              A match is a post, not a customer. The score says how closely the post fits your keywords and buying
              language; it is not a promise that anyone will buy. When scoring is unavailable, the lead shows as not
              scored, never as a guessed number.
            </p>
            <p>
              <Link href="/radar" className="hb-link">
                Open the full sample hunt with three watch lists
              </Link>
            </p>
          </div>
        </Spread>
      </Leaf>
    </Board>
  )
}
