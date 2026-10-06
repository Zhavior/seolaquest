'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../artifact/IconSprite'
import { CLAIM_MIN_SCORE, CLAIM_XP, levelTable, tierForScore, type Tier } from '../rules'
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
import { valleyAudio } from '../valley/audio'
import type { BeaconView } from '../valley/scene'
import { HERO_POSTS } from './heroPosts'
import { useHomeStage } from './HomeStage'

const LEVELS = levelTable(10).map((row) => row.cumulativeXp)
const FIRST_LEAD = SAMPLE_QUESTS[0]

const TIER: Record<Tier, { name: string; color: string; icon: IconName }> = {
  ENGAGE: { name: 'Legendary', color: '#FF8A3D', icon: 'gem-leg' },
  WATCH: { name: 'Rare', color: '#5DB2FF', icon: 'gem-rare' },
  IGNORE: { name: 'Common', color: '#C9CBD2', icon: 'gem-common' },
}
const TEAL = '#5DD6B0'
const MUTED = '#6E6590'

/**
 * The hero: copy on the scene, then the sample hunt as a quest log and a lead
 * card. Picking a lead lights its beacon in the valley, claiming one fires a
 * light pillar, and the XP comes from the same pure rules the full sample hunt
 * and the product use. Every post, handle and score here is invented.
 */
export function HeroStage({ children }: { children: ReactNode }) {
  const [sel, setSel] = useState(0)
  const [state, setState] = useState<SampleState>(() => ({
    ...initialState(),
    log: 'Pick a lead. Read the post, then claim it or dismiss it.',
  }))
  const [levelNote, setLevelNote] = useState('')
  const stage = useHomeStage()

  const post = HERO_POSTS[sel]
  const tier = tierForScore(post.score)
  const look = TIER[tier]
  const done = state.claimed.includes(post.id) ? 'claimed' : state.dismissed.includes(post.id) ? 'dismissed' : null
  const level = standing(state.xp, LEVELS)
  const ready = questReady(state, FIRST_LEAD)

  const beacons: BeaconView[] = useMemo(
    () =>
      HERO_POSTS.map((p, i) => ({
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
      // After the claim bell has struck, so the two do not blur together.
      window.setTimeout(() => valleyAudio.levelUp(), 220)
    }
  }

  function onClaim() {
    if (done) return
    const next = claim(state, post)
    valleyAudio.claim()
    setState(next)
    setLevelNote('')
    noteLevelUp(state, next)
    stage.fire(sel)
  }

  function onDismiss() {
    if (done) return
    valleyAudio.dismiss()
    setState((current) => dismiss(current, post))
  }

  function onCollect() {
    const next = claimReward(state, FIRST_LEAD)
    valleyAudio.claim()
    setState(next)
    setLevelNote('')
    noteLevelUp(state, next)
  }

  const tint = done === 'claimed' ? TEAL : done === 'dismissed' ? MUTED : look.color

  return (
    <>
      <div className="hb-hero-top">{children}</div>
      <div className="hb-deck">
        <section className="hb-panel hb-log" aria-label="Quest log, sample leads">
          <div className="hb-ph">
            <b>QUEST LOG</b>
            <span>SAMPLE LEADS</span>
          </div>

          <div className="hb-herohud">
            <span className="hb-lv">
              <Icon name="star" size={14} /> LV {level.level}
            </span>
            <div
              className="hb-xpbar"
              role="progressbar"
              aria-label="Sample XP into this level"
              aria-valuemin={0}
              aria-valuemax={level.span}
              aria-valuenow={level.intoLevel}
            >
              <i style={{ width: `${(level.intoLevel / level.span) * 100}%` }} />
            </div>
            <span className="hb-xptxt">
              {state.xp} XP · {level.toNext} to level {level.level + 1}
            </span>
          </div>

          <ul className="hb-qrows" aria-label="Leads found">
            {HERO_POSTS.map((p, i) => {
              const t = TIER[tierForScore(p.score)]
              const isDone = state.claimed.includes(p.id) ? 'Claimed' : state.dismissed.includes(p.id) ? 'Dismissed' : null
              const color = isDone === 'Claimed' ? TEAL : isDone === 'Dismissed' ? MUTED : t.color
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="hb-qrow"
                    aria-pressed={i === sel}
                    style={i === sel ? { borderColor: color } : undefined}
                    onClick={() => setSel(i)}
                    onMouseEnter={() => valleyAudio.hover()}
                  >
                    <span style={{ opacity: isDone ? 0.4 : 1, display: 'inline-flex' }}>
                      <Icon name={t.icon} size={38} />
                    </span>
                    <span className="hb-qrow-text">
                      <b>{p.name}</b>
                      <small>
                        {p.handle} · {isDone ?? t.name}
                      </small>
                    </span>
                    <span className="hb-qrow-score" style={{ color: isDone ? '#6E6590' : t.color }}>
                      {p.score}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section
          className="hb-panel hb-tip"
          aria-label="Selected lead"
          style={{ borderColor: tint, boxShadow: `0 0 0 3px #0E0A1C, 0 0 0 4px #5A4720, 0 0 46px ${tint}45, 0 28px 60px rgba(0,0,0,.7)` }}
        >
          <div className="hb-tbar" style={{ background: tint }} />
          <div className="hb-tb" key={post.id}>
            <div className="hb-tt">
              <span style={{ display: 'inline-flex', filter: `drop-shadow(0 0 12px ${tint})` }}>
                <Icon name={look.icon} size={62} className="hb-floaty" />
              </span>
              <div>
                <h2 className="hb-tip-name" style={{ color: tint }}>
                  {post.name}
                </h2>
                <small>{look.name} buyer lead · X post</small>
              </div>
            </div>
            <div className="hb-bigscore">
              <b>{post.score}</b>
              <span>BUYER INTENT</span>
            </div>
            <hr />
            <blockquote className="hb-quote">“{post.text}”</blockquote>
            <p className="hb-by">{post.handle} · sample post</p>
            <div className="hb-facts">
              <p className="hb-good">
                <Icon name="star" size={20} />
                {claimPays(post)
                  ? `Claiming pays ${CLAIM_XP} XP. Claiming is not contacting.`
                  : `Scores under ${CLAIM_MIN_SCORE} pay no claim XP.`}
              </p>
              <p className="hb-src">
                <Icon name="scroll" size={20} />
                Source post attached. Dismissing pays no XP either way.
              </p>
            </div>
            {!done ? (
              <div className="hb-acts">
                <button type="button" className="hb-btn hb-btn--small" onClick={onClaim}>
                  {claimPays(post) ? `Claim +${CLAIM_XP} XP` : 'Claim · 0 XP'}
                </button>
                <button type="button" className="hb-btn hb-btn--label hb-btn--small" onClick={onDismiss}>
                  Dismiss
                </button>
              </div>
            ) : (
              <p className="hb-done">
                {done === 'claimed'
                  ? 'Banked. The beacon burns teal in the valley.'
                  : 'Dismissed. The beacon has gone dark.'}
              </p>
            )}
            {ready ? (
              <p className="hb-quest-done">
                <span className="hb-mono">Quest done: {FIRST_LEAD.title}</span>
                <button type="button" className="hb-btn hb-btn--small" onClick={onCollect}>
                  Collect +{FIRST_LEAD.rewardXp} XP
                </button>
              </p>
            ) : null}
          </div>
        </section>

        <p className="hb-note" role="status">
          <span className="hb-slip">SAMPLE</span> {SAMPLE_LABEL}
          <br />
          {levelNote || state.log}
        </p>
      </div>
    </>
  )
}
