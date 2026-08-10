import type { PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logger } from '../core/infrastructure/logger'
import { GamifyLevelCurve } from './GamifyLevelCurve'

/**
 * Progression in the shape the UI renders it.
 *
 * `GamifyProfile` stores a lifetime total; every surface in this app shows
 * "progress inside the current level" against "this level's bar". That
 * conversion belongs in exactly one place — two copies would drift and the HUD
 * would eventually claim a level the ledger disagrees with, which is the failure
 * the legacy `User.xp`/`User.level` columns actually produced.
 */
export interface HunterProgression {
  level: number
  /** XP earned since the current level began, not the lifetime total. */
  xp: number
  /** XP the current level costs end to end. */
  xpRequired: number
  lifetimeXp: number
  reputation: number
  progressPercent: number
}

const UNRANKED: HunterProgression = {
  level: 1,
  xp: 0,
  xpRequired: GamifyLevelCurve.cumulativeXpRequiredForLevel(2),
  lifetimeXp: 0,
  reputation: 0,
  progressPercent: 0,
}

type ProgressionPrisma = Pick<PrismaClient, 'gamifyProfile'>

export function toHunterProgression(profile: {
  lifetimeXp: number
  reputation: number
}): HunterProgression {
  const curve = GamifyLevelCurve.progressForLifetimeXp(profile.lifetimeXp)
  return {
    level: curve.level,
    xp: curve.lifetimeXp - curve.currentLevelXp,
    xpRequired: curve.nextLevelXp - curve.currentLevelXp,
    lifetimeXp: curve.lifetimeXp,
    reputation: profile.reputation,
    progressPercent: curve.progressPercent,
  }
}

/**
 * Reads a hunter's progression, or level 1 if they have no ledger yet.
 *
 * A missing profile is not an error: it is what every account looks like before
 * its first enrollment, and level 1 with an empty bar is the honest rendering of
 * "has earned nothing yet". Showing a number the ledger cannot account for is
 * the thing this replaced.
 */
export async function readHunterProgression(
  userId: string,
  db: ProgressionPrisma = prisma
): Promise<HunterProgression> {
  try {
    const profile = await db.gamifyProfile.findUnique({
      where: { userId },
      select: { lifetimeXp: true, reputation: true },
    })
    return profile ? toHunterProgression(profile) : UNRANKED
  } catch (error) {
    // Progression is decoration on most of these surfaces; the shell header must
    // not 500 because the ledger is unreachable. Under-reporting is the safe
    // direction — it never credits XP that was not earned.
    logger.warn(
      { err: error, userId, outcomeCode: 'GAMIFY_PROGRESSION_READ_FAILED' },
      'Could not read gamify progression; rendering as unranked',
    )
    return UNRANKED
  }
}
