'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, RotateCcw, Scan } from 'lucide-react'
import {
  AURORA_ENGAGE_MIN,
  AURORA_IGNORE_BELOW,
  CLAIM_MIN_SCORE,
  CLAIM_XP,
  tierForScore,
} from '../rules'
import { SAMPLE_LABEL, type SamplePost, type SampleSet } from './data'
import {
  SAMPLE_QUESTS,
  SAMPLE_START_MANA,
  canScan,
  claim,
  claimPays,
  claimReward,
  dismiss,
  initialState,
  questProgress,
  questReady,
  recordOutcome,
  scan,
  standing,
  type SampleState,
} from './engine'

type Props = {
  sets: SampleSet[]
  /** Cumulative XP per level from the product's curve, index 0 = level 1. */
  levelCumulative: number[]
  variant?: 'compact' | 'full'
}

function snippet(text: string, max = 96) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

function tierLabel(score: number) {
  const tier = tierForScore(score)
  return tier === 'ENGAGE' ? 'Engage' : tier === 'WATCH' ? 'Watch' : 'Ignore'
}

/**
 * The sample hunt: the whole loop with invented data. Scan, read the source
 * post, claim, and watch the XP rules apply exactly as the product applies
 * them, including the cases where nothing is paid. No network, no account.
 */
export function SampleHunt({ sets, levelCumulative, variant = 'full' }: Props) {
  const [state, setState] = useState<SampleState>(initialState)
  const [setId, setSetId] = useState(sets[0].id)
  const [shownSetId, setShownSetId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<string[]>([])
  const [scanCount, setScanCount] = useState(0)
  const resultsRef = useRef<HTMLHeadingElement>(null)

  const chosen = sets.find((set) => set.id === setId) ?? sets[0]
  const shown = sets.find((set) => set.id === shownSetId) ?? null
  const selected = shown?.posts.find((post) => post.id === selectedId) ?? null
  const level = useMemo(() => standing(state.xp, levelCumulative), [state.xp, levelCumulative])

  useEffect(() => {
    if (scanCount > 0) resultsRef.current?.focus()
  }, [scanCount])

  function runScan() {
    if (!canScan(state)) {
      setState((prev) => scan(prev, chosen))
      return
    }
    setState((prev) => scan(prev, chosen))
    setShownSetId(chosen.id)
    setSelectedId(null)
    setScanCount((count) => count + 1)
  }

  function reset() {
    setState(initialState())
    setShownSetId(null)
    setSelectedId(null)
    setDrafts([])
    setScanCount(0)
  }

  const showChooser = sets.length > 1

  return (
    <div className="hb-hunt" data-variant={variant}>
      <p className="hb-hunt-label hb-mono">
        <span className="hb-slip" style={{ marginRight: '0.6rem' }}>SAMPLE</span>
        {SAMPLE_LABEL}
      </p>

      <div className="hb-hunt-grid">
        <div className="hb-hunt-main">
          {showChooser ? (
            <fieldset className="hb-hunt-step">
              <legend className="hb-h3">
                <span className="hb-stepno">1</span> Pick a watch list
              </legend>
              <div className="hb-chips" role="radiogroup" aria-label="Watch list">
                {sets.map((set) => (
                  <label key={set.id} className="hb-chip">
                    <input
                      type="radio"
                      name="watch-list"
                      value={set.id}
                      checked={set.id === setId}
                      onChange={() => setSetId(set.id)}
                    />
                    <span className="hb-punch" data-on={set.id === setId ? '' : undefined} aria-hidden="true" />
                    <span>
                      <strong>{set.keyword}</strong>
                      <span className="hb-soft hb-chip-blurb">{set.blurb}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="hb-hunt-step">
              <span className="hb-h3">
                <span className="hb-stepno">1</span> Watch list
              </span>
              <span className="hb-chip hb-chip--fixed">
                <span className="hb-punch" data-on="" aria-hidden="true" />
                <span>
                  <strong>{chosen.keyword}</strong>
                  <span className="hb-soft hb-chip-blurb">{chosen.blurb}</span>
                </span>
              </span>
            </p>
          )}

          <div className="hb-hunt-step">
            <p className="hb-h3">
              <span className="hb-stepno">2</span> Scan X
            </p>
            <div className="hb-row">
              <button
                type="button"
                className="hb-btn"
                onClick={runScan}
                disabled={!canScan(state)}
                aria-describedby="hb-scan-help"
              >
                <Scan size={18} aria-hidden="true" />
                Scan for “{chosen.keyword}”
              </button>
              <span id="hb-scan-help" className="hb-mono hb-soft">
                {canScan(state)
                  ? '1 mana per scan. Real scans need a paid plan.'
                  : 'Out of sample mana. Real mana comes with a paid plan.'}
              </span>
            </div>
          </div>

          <div className="hb-hunt-step">
            <h3 className="hb-h3" tabIndex={-1} ref={resultsRef}>
              <span className="hb-stepno">3</span> Read the source
            </h3>
            {shown ? (
              <div key={scanCount} className="hb-hinge-in">
                <table className="hb-ledger hb-ledger--posts">
                  <caption>
                    {shown.posts.length} matches kept for “{shown.keyword}”. {shown.dropped.length} more were dropped as
                    noise before you saw them: {shown.dropped.map((item) => item.who).join(', ')}.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Score</th>
                      <th scope="col">Action</th>
                      <th scope="col">Post</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.posts.map((post) => {
                      const isSelected = post.id === selectedId
                      const isClaimed = state.claimed.includes(post.id)
                      const isDismissed = state.dismissed.includes(post.id)
                      return (
                        <tr key={post.id} data-selected={isSelected ? '' : undefined} data-facedown={isDismissed ? '' : undefined}>
                          <td className="hb-mono hb-score">{post.score}</td>
                          <td>
                            <span className="hb-tag" data-tier={tierForScore(post.score)}>
                              {tierLabel(post.score)}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="hb-rowbtn"
                              aria-pressed={isSelected}
                              onClick={() => setSelectedId(post.id)}
                            >
                              <span className="hb-punch" data-on={isClaimed ? '' : undefined} aria-hidden="true" />
                              <span>
                                <span className="hb-mono hb-soft">{post.handle}</span>
                                <span className="hb-rowtext">{snippet(post.text)}</span>
                                {isClaimed ? <span className="hb-mono hb-state">Claimed</span> : null}
                                {isDismissed ? <span className="hb-mono hb-state">Dismissed</span> : null}
                              </span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="hb-soft hb-empty">
                No scan yet. Results appear here with the source post attached to every row.
              </p>
            )}
          </div>

          {selected ? (
            <article key={selected.id} className="hb-evidence hb-hinge-in" aria-label={`Source post from ${selected.handle}`}>
              <header className="hb-evidence-head">
                <h3 className="hb-h3">
                  <span className="hb-stepno">4</span> Claim it, or don&apos;t
                </h3>
                <p className="hb-mono">
                  {selected.handle} <span className="hb-soft">· {selected.name} · sample</span>
                </p>
              </header>
              <blockquote className="hb-quote">{selected.text}</blockquote>
              <div className="hb-aurora">
                <p className="hb-aurora-score hb-mono" aria-label={`Score ${selected.score} of 100`}>
                  {selected.score}
                </p>
                <div>
                  <p className="hb-h3">
                    {tierLabel(selected.score)}
                  </p>
                  <ul className="hb-reasons hb-mono">
                    {selected.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="hb-mono hb-soft">
                Engage {AURORA_ENGAGE_MIN}+ · Watch {AURORA_IGNORE_BELOW}–{AURORA_ENGAGE_MIN - 1} · Ignore under{' '}
                {AURORA_IGNORE_BELOW}. A policy line, not a chance of a sale.
              </p>
              <p className="hb-xpline">
                {claimPays(selected)
                  ? `Claiming this lead pays +${CLAIM_XP} XP (score ${selected.score} is at or above ${CLAIM_MIN_SCORE}).`
                  : `Claiming this lead saves it for follow-up but pays +0 XP (score ${selected.score} is under ${CLAIM_MIN_SCORE}).`}
              </p>
              <EvidenceActions
                post={selected}
                state={state}
                drafted={drafts.includes(selected.id)}
                onClaim={() => setState((prev) => claim(prev, selected))}
                onDismiss={() => setState((prev) => dismiss(prev, selected))}
                onDraft={() => setDrafts((prev) => (prev.includes(selected.id) ? prev : [...prev, selected.id]))}
                onOutcome={() => setState((prev) => recordOutcome(prev, selected))}
              />
              {drafts.includes(selected.id) ? (
                <figure className="hb-draft">
                  <figcaption className="hb-mono">Draft reply · sample · never posted anywhere</figcaption>
                  <p>{selected.draft}</p>
                </figure>
              ) : null}
            </article>
          ) : null}
        </div>

        <aside className="hb-hud" aria-label="Sample hunter status">
          <div className="hb-hud-block">
            <p className="hb-mono hb-soft">Sample hunter</p>
            <p className="hb-hud-level">
              Level <span className="hb-mono">{level.level}</span>
            </p>
            <div
              className="hb-bar"
              role="progressbar"
              aria-label={`Progress to level ${level.level + 1}`}
              aria-valuemin={0}
              aria-valuemax={level.span}
              aria-valuenow={level.intoLevel}
            >
              <span style={{ transform: `scaleX(${level.intoLevel / level.span})` }} />
            </div>
            <p className="hb-mono">
              {state.xp} XP · {level.toNext} to level {level.level + 1}
            </p>
          </div>

          <div className="hb-hud-block">
            <p className="hb-mono hb-soft">Mana (scan credits)</p>
            <p className="hb-mana" aria-label={`${state.mana} of ${SAMPLE_START_MANA} sample mana left`}>
              {Array.from({ length: SAMPLE_START_MANA }, (_, index) => (
                <span key={index} className="hb-punch" data-on={index < state.mana ? '' : undefined} aria-hidden="true" />
              ))}
              <span className="hb-mono">
                {state.mana}/{SAMPLE_START_MANA}
              </span>
            </p>
          </div>

          <div className="hb-hud-block">
            <p className="hb-mono hb-soft">Quests</p>
            <ul className="hb-quests">
              {SAMPLE_QUESTS.map((quest) => {
                const progress = questProgress(state, quest)
                const ready = questReady(state, quest)
                const done = state.rewardsClaimed.includes(quest.code)
                return (
                  <li key={quest.code} className="hb-quest" data-done={done ? '' : undefined}>
                    <p>
                      <strong>{quest.title}</strong>
                      <span className="hb-mono">
                        {' '}
                        {progress}/{quest.target}
                      </span>
                    </p>
                    <p className="hb-mono hb-soft">
                      {done ? 'Claimed' : ready ? 'Ready to claim' : 'In progress'} · +{quest.rewardXp} XP
                    </p>
                    {ready ? (
                      <button
                        type="button"
                        className="hb-btn hb-btn--small"
                        onClick={() => setState((prev) => claimReward(prev, quest))}
                      >
                        <Check size={16} aria-hidden="true" /> Collect +{quest.rewardXp} XP
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>

          <button type="button" className="hb-btn hb-btn--label hb-btn--small" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" /> Start over
          </button>
        </aside>
      </div>

      <p className="hb-hunt-log hb-mono" role="status" aria-live="polite">
        {state.log}
      </p>
    </div>
  )
}

function EvidenceActions({
  post,
  state,
  drafted,
  onClaim,
  onDismiss,
  onDraft,
  onOutcome,
}: {
  post: SamplePost
  state: SampleState
  drafted: boolean
  onClaim: () => void
  onDismiss: () => void
  onDraft: () => void
  onOutcome: () => void
}) {
  const claimed = state.claimed.includes(post.id)
  const dismissed = state.dismissed.includes(post.id)
  const outcome = state.outcomes.includes(post.id)
  return (
    <div className="hb-row hb-actions">
      <button type="button" className="hb-btn" onClick={onClaim} disabled={claimed || dismissed}>
        {claimed ? 'Claimed' : `Claim lead${claimPays(post) ? ` (+${CLAIM_XP} XP)` : ' (+0 XP)'}`}
      </button>
      <button type="button" className="hb-btn hb-btn--label" onClick={onDraft} disabled={drafted}>
        {drafted ? 'Draft shown' : 'Draft reply'}
      </button>
      {claimed ? (
        <button type="button" className="hb-btn hb-btn--label" onClick={onOutcome} disabled={outcome}>
          {outcome ? 'Outcome recorded' : 'Record “replied”'}
        </button>
      ) : (
        <button type="button" className="hb-btn hb-btn--label" onClick={onDismiss} disabled={dismissed}>
          {dismissed ? 'Dismissed' : 'Dismiss'}
        </button>
      )}
    </div>
  )
}
