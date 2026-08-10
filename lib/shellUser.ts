import 'server-only'

import type { User } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { GamifyEnrollmentService } from '@/src/modules/gamify/GamifyEnrollmentService'
import { readHunterProgression } from '@/src/modules/gamify/hunterProgression'

/**
 * Telemetry the authenticated shell header renders. Every field is read from the
 * database on each request, so the HUD can never show a number the backend does
 * not agree with.
 */
export type ShellUser = {
  name: string | null
  title: string | null
  level: number
  xp: number
  xpRequired: number
  questsRemaining: number
  maxCredits: number
  openQuests: number
  profileIconKey: string | null
}

/**
 * Signals the queue still shows. This matches the dashboard's own lead query so
 * the header count and the visible queue can never disagree.
 */
async function countOpenQuests(userId: string) {
  try {
    return await prisma.lead.count({
      where: { userId, status: { in: ['NEW', 'VIEWED'] } },
    })
  } catch (error) {
    // A HUD counter must never take the whole shell down. Zero reads as "nothing
    // waiting", which is the safe direction to be wrong in: it under-promises.
    logger.warn(
      { err: error, userId, outcomeCode: 'SHELL_OPEN_QUEST_COUNT_FAILED' },
      'Could not count open quests for the shell header',
    )
    return 0
  }
}

/**
 * Puts the hunter on the quest board.
 *
 * This runs from the authenticated shell layout, so it is the earliest point at
 * which every signed-in request passes through one place. Enrollment has to
 * happen before the user can claim anything: quest progress is only recorded
 * against assignments that already exist, and the source event is consumed once.
 *
 * Failure is swallowed on purpose. Missing an enrollment pass costs a cycle of
 * quest progress; throwing here would take down every authenticated page.
 */
async function ensureOnTheBoard(userId: string) {
  try {
    await new GamifyEnrollmentService().ensureEnrolled(userId)
  } catch (error) {
    logger.warn(
      { err: error, userId, outcomeCode: 'GAMIFY_ENROLLMENT_FAILED' },
      'Could not enroll the hunter in the active quest catalog',
    )
  }
}

export async function toShellUser(user: User): Promise<ShellUser> {
  // Enrollment first, and awaited: it creates the GamifyProfile the progression
  // read below depends on, so racing them would render a brand-new account as
  // unranked on its very first page load.
  await ensureOnTheBoard(user.id)

  const [progression, openQuests] = await Promise.all([
    readHunterProgression(user.id),
    countOpenQuests(user.id),
  ])

  return {
    name: user.name,
    title: user.title,
    level: progression.level,
    xp: progression.xp,
    xpRequired: progression.xpRequired,
    questsRemaining: user.questsRemaining,
    maxCredits: user.maxCredits,
    openQuests,
    profileIconKey: user.profileIconKey,
  }
}
