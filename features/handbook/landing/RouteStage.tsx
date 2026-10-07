import Link from 'next/link'
import { PlateIcon, type IconName } from '../artifact/IconSprite'
import { Board, Leaf, Spread } from '../components/primitives'

const STOPS: Array<{ numeral: string; key: string; icon: IconName; label: string; hot?: boolean; body: string }> = [
  {
    numeral: 'I',
    key: 'Ask',
    icon: 'spyglass',
    label: 'Ask: spyglass',
    body: 'Type a question your buyers ask, and the site you want named in the answer. SEOlaQuest puts the question to Perplexity, one engine for now.',
  },
  {
    numeral: 'II',
    key: 'Read',
    icon: 'eye',
    label: 'Read: all-seeing eye',
    body: 'See every page the search found and every page the answer cited, in order. Found but not cited is its own result, and often the useful one.',
  },
  {
    numeral: 'III',
    key: 'Sort',
    icon: 'map',
    label: 'Sort: map',
    hot: true,
    body: 'Each source is sorted as a forum, a review site, an article or a vendor page. Sites the rules do not recognise are marked as a guess, not passed off as known.',
  },
  {
    numeral: 'IV',
    key: 'Act',
    icon: 'sword',
    label: 'Act: crossed swords',
    body: 'Each type points to a different move: answer the thread, get listed, pitch the writer, or fix your own page. SEOlaQuest shows the map; you do the work.',
  },
]

/** The route: four verbs, each on an engraved plate. */
export function RouteStage() {
  return (
    <Board volume="hunt" id="route" labelledBy="route-title">
      <Leaf>
        <Spread head="Four verbs. One answer." headId="route-title" note="How a scan works, from question to plan.">
          <div className="hb-stack" style={{ '--gap': '1.5rem' } as React.CSSProperties}>
            <ol className="hb-stops">
              {STOPS.map((stop) => (
                <li key={stop.key} className={stop.hot ? 'hb-stop hb-stop--hot' : 'hb-stop'}>
                  <PlateIcon name={stop.icon} label={stop.label} />
                  <h3>
                    <span className="hb-plain">{stop.numeral}</span> · {stop.key}
                  </h3>
                  <p>{stop.body}</p>
                </li>
              ))}
            </ol>
            <p className="hb-prose">
              A citation is a snapshot, not a ranking you own. The same question can cite different sources tomorrow,
              and SEOlaQuest does not promise your site will be cited after you act. It shows you where the answer comes
              from today.
            </p>
            <p>
              <Link href="/radar" className="hb-link">
                Open the full sample scan
              </Link>
            </p>
          </div>
        </Spread>
      </Leaf>
    </Board>
  )
}
