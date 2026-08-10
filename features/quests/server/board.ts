import 'server-only'

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
  progress: number
  target: number
  progressPercent: number
  rewardXp: number
  expiresAt: string | null
  claimedAt: string | null
}

export interface QuestBoardData {
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

/**
 * Reads the signed-in hunter's board.
 *
 * Enrollment is not done here. The shell layout already puts every
 * authenticated request on the board, and doing it again on read would mean a
 * page that silently writes — which makes it impossible to tell an empty board
 * from a broken enrollment.
 */
export async function loadQuestBoard(): Promise<QuestBoardData> {
  const user = await requireCurrentUser()

  const [assignments, progression] = await Promise.all([
    new GamifyQuestQueryService().getAssignments(user.id),
    readHunterProgression(user.id),
  ])

  const entries: QuestBoardEntry[] = assignments.map((assignment) => ({
    id: assignment.id,
    code: assignment.code,
    title: assignment.title,
    description: assignment.description,
    type: assignment.type,
    status: assignment.status as GamifyQuestStatus,
    progress: assignment.progress,
    target: assignment.target,
    progressPercent: assignment.progressPercent,
    rewardXp: assignment.rewardXp,
    expiresAt: assignment.expiresAt?.toISOString() ?? null,
    claimedAt: assignment.claimedAt?.toISOString() ?? null,
  }))

  return {
    progression,
    claimable: entries.filter((entry) => entry.status === 'COMPLETED'),
    active: entries.filter((entry) => entry.status === 'IN_PROGRESS'),
    finished: entries.filter((entry) => TERMINAL.includes(entry.status)),
    catalogEmpty: entries.length === 0,
  }
}
