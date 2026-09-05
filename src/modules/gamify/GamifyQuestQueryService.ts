import type { PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'
import { questCompletionAvailable } from './questAvailability'
import { GAMIFY_QUEST_CATALOG } from './questCatalog'
import type { GamifyQuestStatus } from './questTypes'

type QuestQueryPrisma = Pick<PrismaClient, 'gamifyQuestAssignment'>

export class GamifyQuestQueryService {
  // Defaults to the shared client, matching the rest of the gamify services, so
  // callers that just want to read the board do not have to thread it through.
  constructor(private readonly db: QuestQueryPrisma = prisma) {}

  async getAssignments(actorId: string, statuses?: GamifyQuestStatus[]) {
    const assignments = await this.db.gamifyQuestAssignment.findMany({
      where: {
        actorId,
        ...(statuses?.length ? { status: { in: statuses } } : {}),
      },
      include: { quest: true },
      orderBy: { assignedAt: 'desc' },
    })

    return assignments.map((assignment) => {
      const catalogQuest = GAMIFY_QUEST_CATALOG.find(
        quest => quest.code === assignment.quest.code && quest.version === assignment.quest.version
      )

      return {
        id: assignment.id,
        code: assignment.quest.code,
        version: assignment.quest.version,
        title: catalogQuest?.title ?? assignment.quest.title,
        description: catalogQuest?.description ?? assignment.quest.description,
        type: assignment.quest.type,
        status: assignment.status,
        completionAvailable: questCompletionAvailable(assignment.quest.eventType),
        progress: assignment.progress,
        target: assignment.target,
        progressPercent: Math.round((assignment.progress / assignment.target) * 100),
        rewardXp: assignment.rewardXp,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt,
        claimedAt: assignment.claimedAt,
        expiresAt: assignment.expiresAt,
      }
    })
  }
}
