import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Scroll, Sparkles } from 'lucide-react'
import { QuestPageHeader, QuestPageShell, QuestStatusPill, QuestTicker } from '@/components/quest'
import { loadQuestBoard } from '@/features/quests/server/board'
import { QuestBoardSkeleton } from './loading'

const QuestBoard = dynamic(() => import('@/features/quests/components/QuestBoard'))

export const metadata: Metadata = {
  title: 'Quest Board | SEOlaQuest',
  description: 'Your active quests, their progress, and the rewards waiting to be claimed.',
}

/**
 * The actual Quest Board.
 *
 * Everything on this page comes from `GamifyQuestAssignment` — the same rows the
 * event pipeline advances — so a number here can always be traced to a
 * contribution and a source event. The route that used to carry this name lists
 * scan runs and now says so; it lives at /app/runs.
 */
export default function QuestBoardPage() {
  return (
    <QuestPageShell watermark={<Scroll className="h-[650px] w-[650px] text-ink" />}>
      <QuestTicker label="Quest board. Active bounties and rewards.">
        <Sparkles className="h-5 w-5 text-ink" /> 📜 QUEST BOARD{' '}
        <Sparkles className="h-5 w-5 text-ink" /> 🏆 ACTIVE BOUNTIES
      </QuestTicker>

      <Suspense fallback={<QuestBoardSkeleton />}>
        <QuestBoardData />
      </Suspense>
    </QuestPageShell>
  )
}

async function QuestBoardData() {
  const board = await loadQuestBoard()
  const claimable = board.claimable.length

  return (
    <>
      <QuestPageHeader
        className="mt-4"
        icon={<Scroll className="h-8 w-8" />}
        eyebrow={<>COMMANDER&apos;S BOARD</>}
        title="Quest Board"
        subtitle={`Level ${board.progression.level} — ${board.progression.lifetimeXp.toLocaleString()} lifetime XP`}
        status={
          <QuestStatusPill
            label="Rewards waiting"
            value={claimable === 1 ? '1 quest' : `${claimable} quests`}
            state={claimable > 0 ? 'live' : 'idle'}
          />
        }
      />

      <section aria-labelledby="practical-quests" className="mb-6 space-y-4 rounded-[20px] border border-outline bg-card p-5">
        <h2 id="practical-quests" className="font-display text-2xl">Move one conversation forward.</h2>
        <p className="text-sm text-ink-muted">These steps guide your work. Reporting a reply or sale does not earn XP.</p>
        <ol className="grid gap-4 md:grid-cols-3">
          <li><h3 className="font-semibold">1. Review the evidence</h3><p className="mt-2 text-sm">Check the source, business fit and freshness before claiming a lead.</p><Link href="/app#battle-ready-signals" className="inline-flex min-h-11 items-center underline">Review leads →</Link></li>
          <li><h3 className="font-semibold">2. Follow up</h3><p className="mt-2 text-sm">Contact a saved lead, then record what actually happened.</p><Link href="/app/leads" className="inline-flex min-h-11 items-center underline">Open follow-ups →</Link></li>
          <li><h3 className="font-semibold">3. Learn from replies</h3><p className="mt-2 text-sm">Review recorded outcomes and refine your keywords for the next scan.</p><Link href="/app/leads" className="inline-flex min-h-11 items-center underline">Review outcome history →</Link></li>
        </ol>
        <p className="text-xs text-ink-muted">Conversion reward quests are paused until verified sales evidence is available. CRM exports and customer reports do not complete them. Previously awarded XP remains unchanged.</p>
      </section>
      <QuestBoard board={board} />
    </>
  )
}
