import type { PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logger } from '../core/infrastructure/logger'
import { GamifyQuestCatalogService } from './GamifyQuestCatalogService'
import { assignmentCycle, earliestDate } from './questCycle'

export interface GamifyEnrollmentResult {
  /** The hunter's progression row existed or was created. */
  enrolled: boolean
  /** Assignments written on this pass. Zero on every call after the first of a cycle. */
  assigned: number
}

type EnrollmentPrisma = Pick<
  PrismaClient,
  'gamifyProfile' | 'gamifyQuest' | 'gamifyQuestAssignment'
>

/**
 * Puts a hunter on the board.
 *
 * `GamifyQuestService.contributeForEvent` only advances assignments that already
 * exist, so enrollment has to happen *before* the user can do anything worth
 * counting — not when they first open the quest board. A hunter who claims a
 * lead on day one and never visits the board would otherwise earn nothing, and
 * the missing progress would be unrecoverable: the contribution is keyed to the
 * source event, which by then is PROCESSED.
 *
 * Written to be called on every authenticated request. The steady state is two
 * reads and no writes — it only touches the database when a quest is genuinely
 * missing an assignment for the current cycle, which is once per hunter per day
 * for DAILY, once per week for WEEKLY, and once ever for the rest.
 */
export class GamifyEnrollmentService {
  private readonly catalog: GamifyQuestCatalogService

  constructor(
    private readonly db: EnrollmentPrisma = prisma,
    catalog?: GamifyQuestCatalogService
  ) {
    this.catalog = catalog ?? new GamifyQuestCatalogService(db)
  }

  async ensureEnrolled(userId: string, at = new Date()): Promise<GamifyEnrollmentResult> {
    const quests = await this.catalog.listActive(at)
    if (quests.length === 0) {
      // No catalog means nothing to assign, but the profile still has to exist:
      // it is the row the HUD reads, and its absence is what currently makes a
      // brand-new account render a level it did not earn.
      await this.ensureProfile(userId)
      return { enrolled: true, assigned: 0 }
    }

    const cycles = new Map(quests.map((quest) => [quest.id, assignmentCycle(quest.type, at)]))

    const existing = await this.db.gamifyQuestAssignment.findMany({
      where: { actorId: userId, questId: { in: quests.map((quest) => quest.id) } },
      select: { questId: true, cycleKey: true },
    })
    const held = new Set(existing.map(({ questId, cycleKey }) => `${questId}:${cycleKey}`))

    const missing = quests.filter((quest) => {
      const cycle = cycles.get(quest.id)
      return cycle ? !held.has(`${quest.id}:${cycle.key}`) : false
    })

    if (missing.length === 0) return { enrolled: true, assigned: 0 }

    await this.ensureProfile(userId)

    // `skipDuplicates` against the (actorId, questId, cycleKey) unique index, so
    // two concurrent requests racing on the same cycle rollover both succeed and
    // neither double-assigns.
    const written = await this.db.gamifyQuestAssignment.createMany({
      data: missing.map((quest) => {
        const cycle = cycles.get(quest.id)!
        return {
          actorId: userId,
          questId: quest.id,
          cycleKey: cycle.key,
          target: quest.target,
          rewardXp: quest.rewardXp,
          expiresAt: earliestDate(quest.endsAt, cycle.expiresAt),
        }
      }),
      skipDuplicates: true,
    })

    logger.info(
      { userId, assigned: written.count, outcomeCode: 'GAMIFY_QUESTS_ASSIGNED' },
      'Assigned quests for the current cycle',
    )

    return { enrolled: true, assigned: written.count }
  }

  /**
   * Reads before it writes on purpose. An unconditional upsert is one line
   * shorter and issues a write on every authenticated request for the lifetime
   * of the account, which is the cost this service is built to avoid.
   */
  private async ensureProfile(userId: string): Promise<void> {
    const existing = await this.db.gamifyProfile.findUnique({
      where: { userId },
      select: { userId: true },
    })
    if (existing) return

    await this.db.gamifyProfile.upsert({
      where: { userId },
      update: {},
      create: { userId, lifetimeXp: 0, level: 1, reputation: 0 },
    })
  }
}
