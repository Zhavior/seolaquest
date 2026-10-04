import { Board, Leaf, Spread } from '../components/primitives'
import { questViews } from '../quests'
import { CLAIM_MIN_SCORE, CLAIM_XP, DAILY_XP_CAP, FEEDBACK_XP, levelTable } from '../rules'

const LEVELS = levelTable(10)
const TOP_XP = LEVELS[LEVELS.length - 1].cumulativeXp
const QUESTS = questViews()
const LIVE = QUESTS.filter((quest) => quest.live)
const SUSPENDED = QUESTS.filter((quest) => !quest.live)
const TOP_REWARD = Math.max(...LIVE.map((quest) => quest.rewardXp))

export function QuestsChapter() {
  return (
    <Board volume="quests" id="quests" labelledBy="quests-title">
      <Leaf>
        <Spread
          head="Quests"
          headId="quests-title"
          note="XP amounts, quest targets and the level curve are read from the product, not written by hand."
        >
          <div className="hb-stack" style={{ '--gap': '2.5rem' } as React.CSSProperties}>
            <p className="hb-lede">Progress you can only earn by doing the work.</p>

            <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
              <h3 className="hb-h3">What pays XP</h3>
              <table className="hb-ledger">
                <caption>Awards are capped at {DAILY_XP_CAP} XP per UTC day, one award per post.</caption>
                <thead>
                  <tr>
                    <th scope="col">Action</th>
                    <th scope="col">XP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Claim a lead scored {CLAIM_MIN_SCORE} or more</th>
                    <td className="hb-mono">+{CLAIM_XP}</td>
                  </tr>
                  <tr>
                    <th scope="row">Record useful Aurora feedback</th>
                    <td className="hb-mono">+{FEEDBACK_XP}</td>
                  </tr>
                  <tr>
                    <th scope="row">Complete a quest and collect it</th>
                    <td className="hb-mono">Quest reward</td>
                  </tr>
                  <tr data-facedown="">
                    <th scope="row">Scan, add a keyword, keep a streak, earn an achievement, report a reply or a sale</th>
                    <td className="hb-mono">0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
              <h3 className="hb-h3">The quest ledger</h3>
              <table className="hb-ledger hb-ledger--quests">
                <caption>Claims counted per UTC cycle. Progress counts every claim, whether or not it paid XP.</caption>
                <thead>
                  <tr>
                    <th scope="col">Quest</th>
                    <th scope="col">Cycle</th>
                    <th scope="col">Claims</th>
                    <th scope="col">Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {LIVE.map((quest) => (
                    <tr key={quest.code}>
                      <th scope="row">
                        {quest.title}
                        <span className="hb-soft hb-quest-desc">{quest.description}</span>
                      </th>
                      <td data-label="Cycle" className="hb-mono">{quest.cadence}</td>
                      <td data-label="Claims" className="hb-mono">{quest.target}</td>
                      <td data-label="Reward">
                        <span className="hb-mono">+{quest.rewardXp} XP</span>
                        <span className="hb-meter" aria-hidden="true">
                          <span style={{ width: `${Math.round((quest.rewardXp / TOP_REWARD) * 100)}%` }} />
                        </span>
                      </td>
                    </tr>
                  ))}
                  {SUSPENDED.map((quest) => (
                    <tr key={quest.code} data-facedown="">
                      <th scope="row">
                        {quest.title}
                        <span className="hb-soft hb-quest-desc">Face down. Suspended until conversions can be verified.</span>
                      </th>
                      <td data-label="Cycle" className="hb-mono">{quest.cadence}</td>
                      <td data-label="Claims" className="hb-mono">{quest.target}</td>
                      <td data-label="Reward" className="hb-mono">Pays nothing today</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
              <h3 className="hb-h3">The level curve</h3>
              <table className="hb-ledger hb-ledger--levels">
                <caption>Cumulative XP for level L is 100 × (L − 1)<sup>1.5</sup>, rounded. Levels have numbers, not names.</caption>
                <thead>
                  <tr>
                    <th scope="col">Level</th>
                    <th scope="col">Lifetime XP</th>
                    <th scope="col">
                      <span className="hb-visually-hidden">Scale</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {LEVELS.map((row) => (
                    <tr key={row.level}>
                      <th scope="row" className="hb-mono">
                        {row.level}
                      </th>
                      <td className="hb-mono">{row.cumulativeXp.toLocaleString('en-US')}</td>
                      <td>
                        <span className="hb-meter" aria-hidden="true">
                          <span style={{ width: `${Math.max(1, Math.round((row.cumulativeXp / TOP_XP) * 100))}%` }} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="hb-prose">
              Streaks and four achievements exist and pay nothing. The Guild Hall is your private journal: no
              leaderboards, no rankings, no other hunters.
            </p>
          </div>
        </Spread>
      </Leaf>
    </Board>
  )
}
