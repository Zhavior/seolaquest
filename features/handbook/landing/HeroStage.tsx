'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Gem, TIER_NAME } from '../components/Gem'
import { CLAIM_MIN_SCORE, CLAIM_XP, levelTable, tierForScore } from '../rules'
import { SAMPLE_LABEL } from '../sample/data'
import {
  SAMPLE_QUESTS,
  claim,
  claimPays,
  claimReward,
  dismiss,
  initialState,
  questReady,
  standing,
  type SampleState,
} from '../sample/engine'
import type { BeaconView } from '../valley/scene'
import { HERO_POSTS } from './heroPosts'
import { useHomeStage } from './HomeStage'

const POSTS = HERO_POSTS
const LEVELS = levelTable(10).map((row) => row.cumulativeXp)
const FIRST_LEAD = SAMPLE_QUESTS[0]

/**
 * The hero: the live valley with the sample hunt laid over it. Picking a lead
 * lights its beacon, claiming one fires a light pillar, and the XP comes from
 * the same pure rules the full sample hunt and the product use. Nothing here is
 * real: every post, handle and score is invented and says so on the panel.
 */
export function HeroStage({ children }: { children: ReactNode }) {
  const [sel, setSel] = useState(0)
  const [state, setState] = useState<SampleState>(() => ({
    ...initialState(),
    log: 'Pick a lead. Read the post, then claim it or dismiss it.',
  }))
  const stage = useHomeStage()
  const [levelNote, setLevelNote] = useState('')

  const post = POSTS[sel]
  const tier = tierForScore(post.score)
  const done = state.claimed.includes(post.id) ? 'claimed' : state.dismissed.includes(post.id) ? 'dismissed' : null
  const level = standing(state.xp, LEVELS)
  const ready = questReady(state, FIRST_LEAD)

  const beacons: BeaconView[] = useMemo(
    () =>
      POSTS.map((p, i) => ({
        state: state.claimed.includes(p.id) ? 'claimed' : state.dismissed.includes(p.id) ? 'dismissed' : 'open',
        selected: i === sel,
      })),
    [state.claimed, state.dismissed, sel],
  )

  useEffect(() => {
    stage.setBeacons(beacons)
  }, [stage, beacons])

  function noteLevelUp(from: SampleState, to: SampleState) {
    const after = standing(to.xp, LEVELS).level
    if (after > standing(from.xp, LEVELS).level) {
      setLevelNote(`Level ${after} reached. The curve puts it at ${LEVELS[after - 1]} XP.`)
    }
  }

  function onClaim() {
    if (done) return
    const next = claim(state, post)
    setState(next)
    setLevelNote('')
    noteLevelUp(state, next)
    stage.fire(sel)
  }

  function onDismiss() {
    if (done) return
    setState((current) => dismiss(current, post))
  }

  function onCollect() {
    const next = claimReward(state, FIRST_LEAD)
    setState(next)
    setLevelNote('')
    noteLevelUp(state, next)
  }

  return (
    <>
      <div className="hb-hero hb-hero--valley">
        {children}
        <section className="hb-ply hb-herohunt" aria-label="Sample hunt">
          <header className="hb-herohunt-head">
            <span className="hb-slip">SAMPLE</span>
            <p className="hb-mono hb-soft">{SAMPLE_LABEL}</p>
          </header>

          <div className="hb-herohunt-hud">
            <p className="hb-hud-level">
              <span className="hb-mono">Level {level.level}</span>
            </p>
            <div
              className="hb-bar"
              role="progressbar"
              aria-label="Sample XP into this level"
              aria-valuemin={0}
              aria-valuemax={level.span}
              aria-valuenow={level.intoLevel}
            >
              <span style={{ transform: `scaleX(${level.intoLevel / level.span})` }} />
            </div>
            <p className="hb-mono hb-soft">
              {state.xp} XP · {level.toNext} to level {level.level + 1}
            </p>
          </div>

          <ul className="hb-questlog" aria-label="Leads found">
            {POSTS.map((p, i) => {
              const t = tierForScore(p.score)
              const status = state.claimed.includes(p.id) ? 'Claimed' : state.dismissed.includes(p.id) ? 'Dismissed' : TIER_NAME[t]
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="hb-questrow"
                    aria-pressed={i === sel}
                    onClick={() => setSel(i)}
                  >
                    <Gem tier={t} muted={status === 'Dismissed'} />
                    <span className="hb-questrow-text">
                      <strong>{p.name}</strong>
                      <span className="hb-mono hb-soft">
                        {p.handle} · {status}
                      </span>
                    </span>
                    <span className="hb-mono hb-questrow-score">{p.score}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <article className="hb-herolead" aria-live="polite">
            <p className="hb-mono hb-soft">
              {TIER_NAME[tier]} lead · score {post.score}
            </p>
            <blockquote className="hb-quote">{post.text}</blockquote>
            <p className="hb-mono hb-soft">
              {claimPays(post)
                ? `Claiming pays ${CLAIM_XP} XP. Claiming is not contacting.`
                : `Scores under ${CLAIM_MIN_SCORE} pay no claim XP.`}
            </p>
            <div className="hb-row">
              <button type="button" className="hb-btn hb-btn--small" onClick={onClaim} disabled={Boolean(done)}>
                {claimPays(post) ? `Claim +${CLAIM_XP} XP` : 'Claim · 0 XP'}
              </button>
              <button type="button" className="hb-btn hb-btn--label hb-btn--small" onClick={onDismiss} disabled={Boolean(done)}>
                Dismiss
              </button>
            </div>
          </article>

          {ready ? (
            <p className="hb-herohunt-quest">
              <span className="hb-mono">Quest done: {FIRST_LEAD.title}</span>
              <button type="button" className="hb-btn hb-btn--small" onClick={onCollect}>
                Collect +{FIRST_LEAD.rewardXp} XP
              </button>
            </p>
          ) : null}

          <p className="hb-mono hb-soft" role="status">
            {levelNote || state.log}
          </p>
        </section>
      </div>
    </>
  )
}
