'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { DashboardValleyHero } from '@/features/dashboard/components/DashboardValleyHero'
import { matchesIntentFilter, type LeadIntentFilter } from '@/features/dashboard/lib/leadScore'
import type { DashboardLead } from '@/features/dashboard/types'
import { CLAIM_MIN_SCORE, CLAIM_XP, tierForScore, type Tier } from '../rules'
import { valleyAudio } from '../valley/audio'
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
  scan,
  standing,
  type SampleState,
} from './engine'

const TIER: Record<Tier, { name: string; edge: string; text: string }> = {
  ENGAGE: { name: 'Engage', edge: 'border-l-[#ff8a3d]', text: 'text-[#ff8a3d]' },
  WATCH: { name: 'Watch', edge: 'border-l-[#5db2ff]', text: 'text-[#5db2ff]' },
  IGNORE: { name: 'Ignore', edge: 'border-l-[#9a93b3]', text: 'text-[#c9c0e0]' },
}

/**
 * The sample hunt laid out like the signed-in dashboard: the valley header with
 * its filter chips, a scan bar over the lead cards, quests, and a dock with
 * mana and XP. It runs the same pure rules as before (./engine), so XP is paid
 * or refused exactly as the product would. Every post and score is invented and
 * the page says so in the header, on every card, and in the dock.
 */
export function SampleDashboard({ sets, levelCumulative }: { sets: SampleSet[]; levelCumulative: readonly number[] }) {
  const [state, setState] = useState<SampleState>(initialState)
  const [setId, setSetId] = useState(sets[0]?.id ?? '')
  const [filter, setFilter] = useState<LeadIntentFilter>('all')
  const [openDraft, setOpenDraft] = useState<string | null>(null)

  const active = sets.find((set) => set.id === setId) ?? sets[0]
  const level = standing(state.xp, levelCumulative)

  // Newest scan first, so the header's four beacons follow the latest finds.
  const found = useMemo(
    () =>
      [...state.scanned]
        .reverse()
        .flatMap((id) => sets.find((set) => set.id === id)?.posts ?? [])
        .filter((post) => !state.dismissed.includes(post.id)),
    [state.scanned, state.dismissed, sets],
  )
  const asLeads = useMemo(() => found.map(toLead), [found])
  const shown = found.filter((post, i) => matchesIntentFilter(asLeads[i], filter))
  const dropped = state.scanned.flatMap((id) => sets.find((set) => set.id === id)?.dropped ?? [])
  const alreadyScanned = state.scanned.includes(active.id)

  function onScan() {
    if (alreadyScanned) return
    setState((current) => scan(current, active))
  }

  function onClaim(post: SamplePost) {
    const next = claim(state, post)
    valleyAudio.claim()
    if (standing(next.xp, levelCumulative).level > level.level) window.setTimeout(() => valleyAudio.levelUp(), 220)
    setState(next)
  }

  function onDismiss(post: SamplePost) {
    valleyAudio.dismiss()
    setState((current) => dismiss(current, post))
  }

  function onCollect(code: string) {
    const quest = SAMPLE_QUESTS.find((item) => item.code === code)
    if (!quest) return
    const next = claimReward(state, quest)
    valleyAudio.claim()
    if (standing(next.xp, levelCumulative).level > level.level) window.setTimeout(() => valleyAudio.levelUp(), 220)
    setState(next)
  }

  return (
    <div
      data-theme="dusk"
      // The Dusk theme paints a page gradient; this sits inside a page that already has one.
      style={{ backgroundImage: 'none', backgroundColor: 'transparent' }}
      className="flex min-w-0 flex-col gap-6 text-ink"
    >
      <DashboardValleyHero
        eyebrow="Sample hunt · invented data"
        name="Sample hunter"
        level={level.level}
        title="Lead Hunter"
        leads={asLeads}
        filter={filter}
        onFilter={setFilter}
      />

      <section aria-labelledby="sample-opportunities-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h2 id="sample-opportunities-title" className="font-mono text-sm font-semibold tracking-wider text-ink">
              DISCOVERED OPPORTUNITIES
            </h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Watch lists">
              {sets.map((set) => (
                <button
                  key={set.id}
                  type="button"
                  aria-pressed={set.id === active.id}
                  onClick={() => setSetId(set.id)}
                  className="min-h-11 rounded-[10px] border border-outline bg-card px-3 text-xs font-semibold text-ink transition-colors hover:bg-highlight aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent"
                >
                  {set.keyword}
                  {state.scanned.includes(set.id) ? <span className="ml-1.5 opacity-70">· scanned</span> : null}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-muted">{active.blurb}</p>
          </div>
          <button
            type="button"
            onClick={onScan}
            disabled={!canScan(state) || alreadyScanned}
            className="inline-flex min-h-11 items-center rounded-[10px] border border-outline bg-accent px-4 font-mono text-xs font-semibold text-on-accent transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {alreadyScanned ? 'Already scanned' : canScan(state) ? 'Run scan · 1 mana' : 'Out of sample mana'}
          </button>
        </div>

        <p role="status" aria-live="polite" className="rounded-[14px] border border-outline bg-inset px-4 py-3 font-mono text-xs text-ink-muted">
          {state.log}
        </p>

        {found.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-outline bg-card p-6 text-sm text-ink-muted">
            No leads yet. Pick a watch list and run a scan; matches land here as cards, the same way they do on the real
            dashboard.
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-[20px] border border-outline bg-card p-6 text-sm text-ink-muted">
            No leads match this filter.{' '}
            <button type="button" className="underline" onClick={() => setFilter('all')}>
              Show all
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Sample leads">
            {shown.map((post) => (
              <LeadCard
                key={post.id}
                post={post}
                claimed={state.claimed.includes(post.id)}
                draftOpen={openDraft === post.id}
                onToggleDraft={() => setOpenDraft((current) => (current === post.id ? null : post.id))}
                onClaim={() => onClaim(post)}
                onDismiss={() => onDismiss(post)}
              />
            ))}
          </ul>
        )}

        {dropped.length ? (
          <details className="rounded-[14px] border border-outline bg-card px-4 py-3 text-sm">
            <summary className="cursor-pointer font-semibold text-ink">
              {dropped.length} posts dropped as noise
            </summary>
            <ul className="mt-3 space-y-2 text-ink-muted">
              {dropped.map((item) => (
                <li key={item.who + item.text}>
                  <span className="font-mono text-xs text-ink">{item.who}</span> · {item.text}{' '}
                  <span className="text-xs">({item.why})</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section aria-labelledby="sample-quests-title" className="rounded-[20px] border border-outline bg-highlight p-5">
        <h2 id="sample-quests-title" className="font-display text-2xl text-ink">
          Quests
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {SAMPLE_QUESTS.map((quest) => {
            const progress = questProgress(state, quest)
            const done = state.rewardsClaimed.includes(quest.code)
            return (
              <li key={quest.code} className="rounded-[14px] border border-outline bg-card p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink">{quest.title}</span>
                  <span className="font-mono text-xs text-ink-muted">+{quest.rewardXp} XP</span>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-inset"
                  role="progressbar"
                  aria-label={`${quest.title} progress`}
                  aria-valuemin={0}
                  aria-valuemax={quest.target}
                  aria-valuenow={progress}
                >
                  <div className="h-full bg-accent" style={{ width: `${(progress / quest.target) * 100}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-muted">
                  <span className="tabular-nums">
                    {progress} / {quest.target} claims
                  </span>
                  {done ? (
                    <span className="text-success">Collected</span>
                  ) : questReady(state, quest) ? (
                    <button
                      type="button"
                      onClick={() => onCollect(quest.code)}
                      className="min-h-11 rounded-[10px] border border-outline bg-accent px-3 font-semibold text-on-accent"
                    >
                      Collect +{quest.rewardXp} XP
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <div
        role="region"
        aria-label="Sample mana and XP"
        className="sticky bottom-0 z-30 rounded-t-[14px] border border-b-0 border-outline bg-[rgb(13_10_28/0.94)] px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <div>
              <span className="block font-mono text-[10px] tracking-wider text-ink-muted">SAMPLE MANA</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-success">
                {state.mana} / {SAMPLE_START_MANA}
              </span>
            </div>
            <div aria-hidden="true" className="h-7 w-px bg-outline" />
            <div className="min-w-0">
              <span className="block font-mono text-[10px] tracking-wider text-ink-muted">SAMPLE XP</span>
              <span className="block truncate font-mono text-sm tabular-nums">
                {state.xp} XP · Lv {level.level}
                <span className="hidden sm:inline"> · {level.toNext} to next</span>
              </span>
            </div>
          </div>
          <Link
            href="/sign-up"
            className="inline-flex min-h-11 shrink-0 items-center rounded-[10px] border border-[#8a6420] bg-[linear-gradient(#f3d58a,#d8a93b)] px-3 text-xs font-bold uppercase tracking-wider text-[#1a1206] hover:brightness-105 sm:px-4"
          >
            Start free
          </Link>
        </div>
        <p className="mt-1.5 text-[11px] text-ink-muted">{SAMPLE_LABEL}</p>
      </div>
    </div>
  )
}

/** The header's chips and beacons read leads; a sample score stands in for a LIVE one and is labelled as sample. */
function toLead(post: SamplePost): DashboardLead {
  return {
    id: post.id,
    platform: 'X',
    author: post.handle,
    content: post.text,
    matched: '',
    url: '',
    sourceCreatedAt: null,
    aurora: { score: post.score, confidence: 0, recommendedAction: tierForScore(post.score), evaluationStatus: 'LIVE' },
  }
}

function LeadCard({
  post,
  claimed,
  draftOpen,
  onToggleDraft,
  onClaim,
  onDismiss,
}: {
  post: SamplePost
  claimed: boolean
  draftOpen: boolean
  onToggleDraft: () => void
  onClaim: () => void
  onDismiss: () => void
}) {
  const tier = TIER[tierForScore(post.score)]
  const pays = claimPays(post)
  return (
    <li
      onMouseEnter={() => valleyAudio.hover()}
      className={`flex flex-col gap-3 rounded-[20px] border border-outline border-l-8 ${tier.edge} bg-card p-4`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-highlight-strong px-2 py-0.5 text-[10px] font-semibold tracking-wider text-on-accent">
          SAMPLE
        </span>
        <span className={`font-mono text-xs font-semibold ${tier.text}`}>
          {post.score} · {tier.name}
        </span>
      </div>
      <div>
        <p className="font-semibold text-ink">{post.name}</p>
        <p className="font-mono text-xs text-ink-muted">{post.handle} · invented post</p>
      </div>
      <p className="text-sm leading-relaxed text-ink">“{post.text}”</p>
      <ul className="flex flex-wrap gap-1.5" aria-label="Why it scored">
        {post.reasons.map((reason) => (
          <li key={reason} className="rounded-md border border-outline bg-inset px-2 py-0.5 text-[11px] text-ink-muted">
            {reason}
          </li>
        ))}
      </ul>
      {draftOpen ? (
        <p className="rounded-[12px] border border-outline bg-inset p-3 text-xs leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">Draft reply, never posted: </span>
          {post.draft}
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {claimed ? (
          <span className="inline-flex min-h-11 items-center rounded-[10px] bg-success/15 px-3 text-xs font-semibold text-success">
            Claimed{pays ? ` · +${CLAIM_XP} XP` : ' · +0 XP'}
          </span>
        ) : (
          <button
            type="button"
            onClick={onClaim}
            className="min-h-11 rounded-[10px] border border-outline bg-accent px-3 text-xs font-semibold text-on-accent"
          >
            {pays ? `Claim +${CLAIM_XP} XP` : `Claim · 0 XP (under ${CLAIM_MIN_SCORE})`}
          </button>
        )}
        <button
          type="button"
          onClick={onToggleDraft}
          aria-expanded={draftOpen}
          className="min-h-11 rounded-[10px] border border-outline bg-card px-3 text-xs font-semibold text-ink hover:bg-highlight"
        >
          {draftOpen ? 'Hide draft' : 'Draft reply'}
        </button>
        {claimed ? null : (
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-11 rounded-[10px] border border-outline bg-inset px-3 text-xs font-semibold text-danger-ink hover:bg-danger/15"
          >
            Dismiss
          </button>
        )}
      </div>
    </li>
  )
}
