import dynamic from 'next/dynamic'
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

      <QuestBoard board={board} />
    </>
  )
}
