import 'server-only'
import { GamifyEnrollmentService } from '@/src/modules/gamify/GamifyEnrollmentService'

import { requireCurrentUser } from '@/lib/auth'
import { GamifyQuestQueryService } from '@/src/modules/gamify/GamifyQuestQueryService'
import { readHunterProgression, type HunterProgression } from '@/src/modules/gamify/hunterProgression'
import type { GamifyQuestStatus } from '@/src/modules/gamify/questTypes'

export interface QuestBoardEntry {
  id: string
  code: string
  title: string
  description: string
  type: string
  status: GamifyQuestStatus
  completionAvailable: boolean
  progress: number
  target: number
  progressPercent: number
  rewardXp: number
  expiresAt: string | null
  claimedAt: string | null
}

export interface QuestBoardData {
  nextHistoryCursor?: string | null
  historyCursor?: string | null
  progression: HunterProgression
  /** Completed and waiting on the hunter to collect. Rendered first. */
  claimable: QuestBoardEntry[]
  active: QuestBoardEntry[]
  /** Claimed or expired, kept for the record. */
  finished: QuestBoardEntry[]
  /**
   * True when the catalog itself is empty — no quests have been published, so
   * the board is blank for a reason that has nothing to do with this hunter.
   * Worth saying out loud rather than rendering an ambiguous empty state.
   */
  catalogEmpty: boolean
}

const TERMINAL: GamifyQuestStatus[] = ['CLAIMED', 'EXPIRED']

/** Ensure current-cycle quests before reading the board; other pages remain read-only. */
export async function loadQuestBoard(before?: string): Promise<QuestBoardData> {
  const user = await requireCurrentUser()
  await new GamifyEnrollmentService().ensureEnrolled(user.id)

  const [page, progression] = await Promise.all([
    new GamifyQuestQueryService().getBoardPage(user.id, before),
    readHunterProgression(user.id),
  ])
  const now = new Date()

  const entries: QuestBoardEntry[] = page.assignments.map((assignment) => ({
    id: assignment.id,
    code: assignment.code,
    title: assignment.title,
    description: assignment.description,
    type: assignment.type,
    status: assignment.status === 'IN_PROGRESS' && assignment.expiresAt && assignment.expiresAt <= now
      ? 'EXPIRED'
      : assignment.status as GamifyQuestStatus,
    completionAvailable: assignment.completionAvailable,
    progress: assignment.progress,
    target: assignment.target,
    progressPercent: assignment.progressPercent,
    rewardXp: assignment.rewardXp,
    expiresAt: assignment.expiresAt?.toISOString() ?? null,
    claimedAt: assignment.claimedAt?.toISOString() ?? null,
  }))
  const visibleEntries = entries.filter(
    entry => entry.status === 'CLAIMED' || entry.completionAvailable
  )

  return {
    progression,
    nextHistoryCursor: page.nextHistoryCursor,
    historyCursor: page.historyCursor,
    claimable: visibleEntries.filter((entry) => entry.status === 'COMPLETED'),
    active: visibleEntries.filter((entry) => entry.status === 'IN_PROGRESS'),
    finished: visibleEntries.filter((entry) => TERMINAL.includes(entry.status)),
    catalogEmpty: entries.length === 0 && !page.historyCursor,
  }
}
