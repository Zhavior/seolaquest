import type { Prisma, PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'
import { questCompletionAvailable } from './questAvailability'
import { GAMIFY_QUEST_CATALOG } from './questCatalog'
import { GAMIFY_QUEST_PROGRESS_EVENTS, type GamifyQuestStatus } from './questTypes'

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

    return assignments.map(presentAssignment)
  }

  async getBoardPage(actorId: string, before?: string, at = new Date()) {
    const available = { quest: { eventType: { in: GAMIFY_QUEST_PROGRESS_EVENTS.filter(questCompletionAvailable) } } }
    const finished: Prisma.GamifyQuestAssignmentWhereInput = {
      OR: [
        { status: 'CLAIMED' },
        { status: 'EXPIRED', ...available },
        { status: 'IN_PROGRESS', expiresAt: { lte: at }, ...available },
      ],
    }
    const cursor = before ? await this.db.gamifyQuestAssignment.findFirst({
      where: { actorId, id: before, ...finished }, select: { id: true, assignedAt: true },
    }) : null
    const [active, history] = await Promise.all([
      this.db.gamifyQuestAssignment.findMany({
        where: { actorId, ...available, OR: [
          { status: 'COMPLETED' },
          { status: 'IN_PROGRESS', OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] },
        ] }, include: { quest: true }, orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      }),
      this.db.gamifyQuestAssignment.findMany({
        where: { actorId, AND: [finished, ...(cursor ? [{ OR: [
          { assignedAt: { lt: cursor.assignedAt } },
          { assignedAt: cursor.assignedAt, id: { lt: cursor.id } },
        ] }] : [])] },
        include: { quest: true }, orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }], take: 26,
      }),
    ])
    return {
      assignments: [...active, ...history.slice(0, 25)].map(presentAssignment),
      nextHistoryCursor: history.length > 25 ? history[24].id : null,
      historyCursor: cursor?.id ?? null,
    }
  }
}

function presentAssignment(assignment: Prisma.GamifyQuestAssignmentGetPayload<{ include: { quest: true } }>) {
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
}
