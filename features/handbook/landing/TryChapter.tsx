import Link from 'next/link'
import { Board, Leaf, Spread } from '../components/primitives'
import { levelTable } from '../rules'
import { SAMPLE_SETS } from '../sample/data'
import { SampleHunt } from '../sample/SampleHunt'

const LEVELS = levelTable(10).map((row) => row.cumulativeXp)

export function TryChapter() {
  return (
    <Board volume="try" id="try" labelledBy="try-title">
      <Leaf>
        <Spread head="Try it" headId="try-title" note="No account. No X connection. Nothing is sent anywhere.">
          <div className="hb-stack" style={{ '--gap': '1.75rem' } as React.CSSProperties}>
            <p className="hb-lede">Run the loop on invented posts. Watch the real XP rules pay, and refuse to pay.</p>
            <SampleHunt sets={[SAMPLE_SETS[0]]} levelCumulative={LEVELS} variant="compact" />
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
