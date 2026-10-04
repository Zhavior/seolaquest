import { AURORA_ENGAGE_MIN, AURORA_IGNORE_BELOW, CLAIM_MIN_SCORE, CLAIM_XP } from '../rules'
import { Board, Leaf, Spread } from '../components/primitives'
import { LeadCard } from './LeadCard'

const COMMANDS = [
  {
    n: 1,
    key: 'Scan',
    body: 'Search X for the keywords you track. One scan costs 1 mana. Scanning needs a paid plan, and it pays no XP.',
  },
  {
    n: 2,
    key: 'Review',
    body: `Open the source post. Aurora scores it 0 to 100 for buyer intent: Engage ${AURORA_ENGAGE_MIN}+, Watch ${AURORA_IGNORE_BELOW} to ${AURORA_ENGAGE_MIN - 1}, Ignore under ${AURORA_IGNORE_BELOW}. A policy line, not a chance of a sale.`,
  },
  {
    n: 3,
    key: 'Claim',
    body: `Save the lead for follow-up. It pays ${CLAIM_XP} XP when the score is ${CLAIM_MIN_SCORE} or more. Claiming does not mean you contacted anyone.`,
  },
  {
    n: 4,
    key: 'Follow up',
    body: 'On paid plans: draft a reply with AI, export the lead to your CRM by webhook, and log what happened. SEOlaQuest does not post to X for you, and logged replies or sales earn no XP.',
  },
]

export function HuntChapter() {
  return (
    <Board volume="hunt" id="hunt" labelledBy="hunt-title">
      <Leaf>
        <Spread head="The Hunt" headId="hunt-title" note="Costs and payouts on this page are the product's real ones.">
          <div className="hb-stack" style={{ '--gap': '2.25rem' } as React.CSSProperties}>
            <p className="hb-lede">Four verbs are the whole game. Scan, review, claim, follow up.</p>

            <div className="hb-figure">
              <div className="hb-figure-card">
                <LeadCard full markers />
              </div>
              <div className="hb-figure-legend">
                <p className="hb-mono hb-soft">Fig. 1. One lead, four zones. The numbers match the rows.</p>
                <ol className="hb-cmds">
                  {COMMANDS.map((command) => (
                    <li key={command.key}>
                      <span className="hb-marker hb-marker--inline" aria-hidden="true">
                        {command.n}
                      </span>
                      <div>
                        <p>
                          <span className="hb-key">{command.key}</span>
                        </p>
                        <p className="hb-cmd-body">{command.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="hb-prose">
              <p>
                A match is a post, not a customer. The score says how closely the post fits your keywords and
                buying language; it is not a promise that anyone will buy.
              </p>
              <p>
                When scoring is unavailable, the lead shows as not scored. It never shows a guessed number.
              </p>
            </div>
          </div>
        </Spread>
      </Leaf>
    </Board>
  )
}
