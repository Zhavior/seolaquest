'use client'

import { useState, useTransition } from 'react'
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
      <div aria-hidden="true" className="h-3 w-full border-2 border-outline bg-inset">
        <div className="h-full bg-emerald-400" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs font-black uppercase tracking-wider text-ink-muted">
        {progress} / {target} complete
      </p>
    </div>
  )
}

function QuestCard({
  entry,
  onClaim,
  claiming,
}: {
  entry: QuestBoardEntry
  onClaim?: (id: string) => void
  claiming: boolean
}) {
  const isClaimable = entry.status === 'COMPLETED'
  const isExpired = entry.status === 'EXPIRED'

  return (
    <QuestPanel as="li" tone={isClaimable ? 'sand' : 'white'} padding="md" className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-black uppercase leading-tight text-ink">{entry.title}</p>
          <p className="mt-1 text-sm font-bold text-ink-muted">{entry.description}</p>
        </div>
        <span className={questBadge({ tone: toneForType(entry.type) })}>{entry.type}</span>
      </div>

      <ProgressBar percent={entry.progressPercent} target={entry.target} progress={entry.progress} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-black uppercase text-ink">
          <Trophy aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
          {entry.rewardXp.toLocaleString()} XP
        </span>

        {isClaimable && onClaim ? (
          <button
            type="button"
            disabled={claiming}
            onClick={() => onClaim(entry.id)}
            className={questButton({ tone: 'gold' })}
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
            {claiming ? 'Claiming…' : 'Claim reward'}
          </button>
        ) : null}

        {entry.status === 'CLAIMED' ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-black uppercase text-ink-muted">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> Claimed
          </span>
        ) : null}

        {isExpired ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-black uppercase text-ink-muted">
            <Lock aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> Expired unclaimed
          </span>
        ) : null}

        {entry.status === 'IN_PROGRESS' && entry.expiresAt ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-ink-muted">
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
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function claim(assignmentId: string) {
    setClaimingId(assignmentId)
    startTransition(async () => {
      const result = await claimQuestRewardAction(assignmentId)
      setClaimingId(null)
      setNotice(result.message ?? (result.ok ? 'Reward claimed.' : 'Could not claim this reward.'))
    })
  }

  if (board.catalogEmpty) {
    return (
      <QuestPanel tone="parchment" padding="lg" className="mt-6 text-center">
        <p className="text-lg font-black uppercase text-ink">No quests are published yet</p>
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
        <p role="status" aria-live="polite" className={questBadge({ tone: 'mint', className: 'w-full' })}>
          {notice}
        </p>
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
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <QuestSectionHeading title="In progress" as="h2" />
        {board.active.length === 0 ? (
          <p className="mt-4 border-2 border-dashed border-hairline p-5 text-center text-sm font-bold text-ink-muted">
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
