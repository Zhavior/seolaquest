'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { sfx } from '@/lib/sfx'
import { CheckCircle2, Clock, Lock, Trophy } from 'lucide-react'
import { QuestPanel, QuestSectionHeading, questBadge, questButton } from '@/components/quest'
import { claimQuestRewardAction } from '@/features/quests/actions'
import type { QuestBoardData, QuestBoardEntry } from '@/features/quests/server/board'

const TYPE_TONE = {
  ONBOARDING: 'cyan',
  DAILY: 'lime',
  WEEKLY: 'gold',
  MILESTONE: 'ember',
  AURORA: 'mint',
} as const

function toneForType(type: string) {
  return TYPE_TONE[type as keyof typeof TYPE_TONE] ?? 'muted'
}

function ProgressBar({ percent, target, progress }: { percent: number; target: number; progress: number }) {
  return (
    <div className="mt-3">
      {/*
        The bar is a picture of the count stated beside it, so it is hidden from
        assistive tech rather than announced twice.
      */}
      <div aria-hidden="true" className="h-3 w-full border border-outline bg-inset rounded-xl">
        <div className="h-full rounded-xl bg-accent motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs font-semibold normal-case tracking-wider text-ink-muted">
        {progress} / {target} complete
      </p>
    </div>
  )
}

function QuestCard({
  entry,
  onClaim,
  claiming,
  busy = false,
}: {
  entry: QuestBoardEntry
  onClaim?: (id: string) => void
  claiming: boolean
  busy?: boolean
}) {
  const isClaimable = entry.status === 'COMPLETED'
  const isExpired = entry.status === 'EXPIRED'

  return (
    <QuestPanel as="li" tone={isClaimable ? 'sand' : 'white'} padding="md" className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-semibold normal-case leading-tight text-ink">{entry.title}</p>
          <p className="mt-1 text-sm font-bold text-ink-muted">{entry.description}</p>
        </div>
        <span className={questBadge({ tone: toneForType(entry.type) })}>{entry.type}</span>
      </div>

      <ProgressBar percent={entry.progressPercent} target={entry.target} progress={entry.progress} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold normal-case text-ink">
          <Trophy aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
          {entry.rewardXp.toLocaleString()} XP
        </span>

        {isClaimable && onClaim ? (
          <button
            type="button"
            disabled={claiming || busy}
            onClick={() => onClaim(entry.id)}
            className={questButton({ tone: 'gold' })}
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
            {claiming ? 'Claiming…' : 'Claim reward'}
          </button>
        ) : null}

        {entry.status === 'CLAIMED' ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold normal-case text-ink-muted">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> Claimed
          </span>
        ) : null}

        {isExpired ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold normal-case text-ink-muted">
            <Lock aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> Expired unclaimed
          </span>
        ) : null}

        {entry.status === 'IN_PROGRESS' && entry.expiresAt ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold normal-case text-ink-muted">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
            Resets {new Date(entry.expiresAt).toUTCString().slice(0, 16)} UTC
          </span>
        ) : null}
      </div>
    </QuestPanel>
  )
}

export default function QuestBoard({ board }: { board: QuestBoardData }) {
  const [notice, setNotice] = useState('')
  const [receipt, setReceipt] = useState<{ level: number; lifetimeXp: number } | null>(null)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const claimInFlight = useRef(false)
  const levelRef = useRef(board.progression.level)
  const reduceMotion = useReducedMotion()

  function claim(assignmentId: string) {
    if (claimInFlight.current) return
    claimInFlight.current = true
    setClaimingId(assignmentId)
    setNotice('')
    setReceipt(null)
    startTransition(async () => {
      try {
        const result = await claimQuestRewardAction(assignmentId)
        setNotice(result.message ?? (result.ok ? 'Reward claimed.' : 'Could not claim this reward.'))
        if (result.ok && result.claimed && typeof result.level === 'number' && typeof result.lifetimeXp === 'number') {
          setReceipt({ level: result.level, lifetimeXp: result.lifetimeXp })
          if (result.level > Math.max(levelRef.current, board.progression.level)) sfx.playLevelUp()
          else sfx.playQuestComplete()
          levelRef.current = result.level
        }
      } catch {
        setNotice('Could not confirm this reward. Please try again; rewards can only be collected once.')
      } finally {
        claimInFlight.current = false
        setClaimingId(null)
      }
    })
  }

  if (board.catalogEmpty) {
    return (
      <QuestPanel tone="parchment" padding="lg" className="mt-6 text-center">
        <p className="text-lg font-semibold normal-case text-ink">No quests are published yet</p>
        <p className="mt-2 text-sm font-bold text-ink-muted">
          The quest catalog is empty, so there is nothing to assign. This is a configuration
          state, not a reflection of your account.
        </p>
      </QuestPanel>
    )
  }

  return (
    <div className="mt-6 space-y-8">
      {notice ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduceMotion || !receipt ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-outline bg-card p-5"
        >
          <p className="flex items-center gap-2 font-semibold text-ink">
            {receipt ? <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-600" /> : null}
            {notice}
          </p>
          {receipt ? (
            <>
              <p className="mt-2 text-sm text-ink-muted">Level {receipt.level} · {receipt.lifetimeXp.toLocaleString()} lifetime XP</p>
              <p className="mt-1 text-sm text-ink-muted">Your progress is saved. Choose your next useful conversation.</p>
              <Link href="/app/leads" className="mt-3 inline-flex min-h-11 items-center font-semibold text-ink underline">Continue reviewing leads →</Link>
            </>
          ) : null}
        </motion.div>
      ) : null}

      {board.claimable.length > 0 ? (
        <section>
          <QuestSectionHeading title="Ready to claim" as="h2" />
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {board.claimable.map((entry) => (
              <QuestCard
                key={entry.id}
                entry={entry}
                onClaim={claim}
                claiming={claimingId === entry.id}
                busy={claimingId !== null}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <QuestSectionHeading title="In progress" as="h2" />
        {board.active.length === 0 ? (
          <p className="mt-4 border border-dashed border-hairline p-5 text-center text-sm font-bold text-ink-muted rounded-xl">
            Nothing in progress. Claim a signal in the Battle Area and it will start counting here.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {board.active.map((entry) => (
              <QuestCard key={entry.id} entry={entry} claiming={false} />
            ))}
          </ul>
        )}
      </section>

      {board.historyCursor || board.nextHistoryCursor ? (
        <nav aria-label="Quest history pages" className="flex flex-wrap gap-4">
          {board.historyCursor ? <Link href="/app/quests" className="inline-flex min-h-11 items-center underline">Latest history</Link> : null}
          {board.nextHistoryCursor ? <Link href={`/app/quests?before=${encodeURIComponent(board.nextHistoryCursor)}`} className="inline-flex min-h-11 items-center underline">Older history →</Link> : null}
        </nav>
      ) : null}

      {board.finished.length > 0 ? (
        <section>
          <QuestSectionHeading title="Settled" as="h2" />
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {board.finished.map((entry) => (
              <QuestCard key={entry.id} entry={entry} claiming={false} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
