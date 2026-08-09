import type { PrismaClient } from '@prisma/client'
import type { GamifyQuestStatus } from './questTypes'

type QuestQueryPrisma = Pick<PrismaClient, 'gamifyQuestAssignment'>

export class GamifyQuestQueryService {
  constructor(private readonly db: QuestQueryPrisma) {}

  async getAssignments(actorId: string, statuses?: GamifyQuestStatus[]) {
    const assignments = await this.db.gamifyQuestAssignment.findMany({
      where: {
        actorId,
        ...(statuses?.length ? { status: { in: statuses } } : {}),
      },
      include: { quest: true },
      orderBy: { assignedAt: 'desc' },
    })

    return assignments.map((assignment) => ({
      id: assignment.id,
      code: assignment.quest.code,
      version: assignment.quest.version,
      title: assignment.quest.title,
      description: assignment.quest.description,
      type: assignment.quest.type,
      status: assignment.status,
      progress: assignment.progress,
      target: assignment.target,
      progressPercent: Math.round((assignment.progress / assignment.target) * 100),
      rewardXp: assignment.rewardXp,
      assignedAt: assignment.assignedAt,
      completedAt: assignment.completedAt,
      claimedAt: assignment.claimedAt,
      expiresAt: assignment.expiresAt,
    }))
  }
}
