import 'server-only'

import type { User } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logger } from '@/src/modules/core/infrastructure/logger'

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

export async function toShellUser(user: User): Promise<ShellUser> {
  return {
    name: user.name,
    title: user.title,
    level: user.level,
    xp: user.xp,
    xpRequired: user.xpRequired,
    questsRemaining: user.questsRemaining,
    maxCredits: user.maxCredits,
    openQuests: await countOpenQuests(user.id),
    profileIconKey: user.profileIconKey,
  }
}
