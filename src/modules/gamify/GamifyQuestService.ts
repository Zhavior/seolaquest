import { Prisma, type PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'
import type { DomainEvent } from '../core/events/DomainEvent'
import { DomainError, NotFoundError } from '../core/infrastructure/errors'
import { GamifyLedgerService } from './GamifyLedgerService'
import { assignmentCycle, earliestDate } from './questCycle'

type Tx = Prisma.TransactionClient
type QuestRewardLedger = Pick<GamifyLedgerService, 'awardQuestRewardInTransaction'>

const SYSTEM_ACTORS = new Set(['system', 'aurora-engine'])

export interface GamifyQuestContributionResult {
  assignmentId: string
  applied: boolean
  progress: number
  target: number
  status: string
}

export interface GamifyQuestClaimResult {
  claimed: boolean
  assignmentId: string
  profile: {
    userId: string
    lifetimeXp: number
    level: number
    reputation: number
  }
}

export class GamifyQuestService {
  private readonly ledger: QuestRewardLedger

  constructor(
    private readonly db: PrismaClient = prisma,
    ledger?: QuestRewardLedger
  ) {
    this.ledger = ledger ?? new GamifyLedgerService(db)
  }

  async assignQuest(actorId: string, questId: string, at = new Date()) {
    return this.db.$transaction(async (tx) => {
      const quest = await tx.gamifyQuest.findUnique({ where: { id: questId } })
      if (!quest) throw new NotFoundError('Quest definition not found')
      if (!quest.enabled || (quest.startsAt && quest.startsAt > at) || (quest.endsAt && quest.endsAt <= at)) {
        throw new DomainError('Quest is not active', 'QUEST_NOT_ACTIVE')
      }

      await tx.gamifyProfile.upsert({
        where: { userId: actorId },
        update: {},
        create: { userId: actorId, lifetimeXp: 0, level: 1, reputation: 0 },
      })

      const cycle = assignmentCycle(quest.type, at)
      const expiresAt = earliestDate(quest.endsAt, cycle.expiresAt)

      return tx.gamifyQuestAssignment.upsert({
        where: { actorId_questId_cycleKey: { actorId, questId, cycleKey: cycle.key } },
        update: {},
        create: {
          actorId,
          questId,
          cycleKey: cycle.key,
          target: quest.target,
          rewardXp: quest.rewardXp,
          expiresAt,
        },
        include: { quest: true },
      })
    })
  }

  async contributeForEvent(event: DomainEvent): Promise<GamifyQuestContributionResult[]> {
    if (event.type === 'lead.converted' && event.payload.conversionType === 'CRM_EXPORTED') return []
    if (SYSTEM_ACTORS.has(event.actorId) || event.source.startsWith('system.')) return []

    const occurredAt = new Date(event.occurredAt)
    if (Number.isNaN(occurredAt.getTime())) {
      throw new DomainError('Quest event has an invalid occurredAt timestamp', 'INVALID_EVENT_TIME')
    }

    return this.db.$transaction(async (tx) => {
      const candidates = await tx.gamifyQuestAssignment.findMany({
        where: {
          actorId: event.actorId,
          status: { in: ['IN_PROGRESS', 'EXPIRED'] },
          quest: {
            enabled: true,
            eventType: event.type,
            eventVersion: event.version,
          },
        },
        include: { quest: true },
        orderBy: { id: 'asc' },
      })

      const results: GamifyQuestContributionResult[] = []
      for (const candidate of candidates) {
        await this.lockAssignment(candidate.id, tx)
        const assignment = await tx.gamifyQuestAssignment.findUnique({
          where: { id: candidate.id },
          include: { quest: true },
        })
        if (!assignment || !['IN_PROGRESS', 'EXPIRED'].includes(assignment.status)) continue
        if (!this.eventFallsWithinQuestWindow(occurredAt, assignment.quest.startsAt, assignment.expiresAt)) continue

        const existing = await tx.gamifyQuestContribution.findUnique({
          where: {
            assignmentId_sourceEventId: {
              assignmentId: assignment.id,
              sourceEventId: event.id,
            },
          },
          select: { id: true },
        })
        if (existing) {
          results.push({
            assignmentId: assignment.id,
            applied: false,
            progress: assignment.progress,
            target: assignment.target,
            status: assignment.status,
          })
          continue
        }

        await tx.gamifyQuestContribution.create({
          data: {
            assignmentId: assignment.id,
            sourceEventId: event.id,
            sourceEventType: event.type,
            sourceEventVersion: event.version,
            increment: 1,
            occurredAt,
          },
        })

        const progress = Math.min(assignment.target, assignment.progress + 1)
        const completed = progress === assignment.target
        const updated = await tx.gamifyQuestAssignment.update({
          where: { id: assignment.id },
          data: {
            progress,
            status: completed ? 'COMPLETED' : assignment.status,
            completedAt: completed ? occurredAt : assignment.completedAt,
          },
        })

        results.push({
          assignmentId: assignment.id,
          applied: true,
          progress: updated.progress,
          target: updated.target,
          status: updated.status,
        })
      }

      return results
    })
  }

  async claimQuest(actorId: string, assignmentId: string, claimedAt = new Date()): Promise<GamifyQuestClaimResult> {
    return this.db.$transaction(async (tx) => {
      await this.lockAssignment(assignmentId, tx)
      const assignment = await tx.gamifyQuestAssignment.findUnique({
        where: { id: assignmentId },
        include: { quest: true },
      })

      if (!assignment || assignment.actorId !== actorId) {
        throw new NotFoundError('Quest assignment not found')
      }
      if (assignment.status === 'EXPIRED') {
        throw new DomainError('Quest assignment expired', 'QUEST_EXPIRED')
      }
      if (assignment.status === 'IN_PROGRESS') {
        const code = assignment.expiresAt && assignment.expiresAt <= claimedAt
          ? 'QUEST_EXPIRED'
          : 'QUEST_NOT_COMPLETE'
        throw new DomainError('Quest assignment is not claimable', code)
      }

      if (assignment.status === 'CLAIMED') {
        const profile = await tx.gamifyProfile.findUnique({
          where: { userId: actorId },
          select: { userId: true, lifetimeXp: true, level: true, reputation: true },
        })
        if (!profile) throw new NotFoundError('Gamify profile not found')
        return { claimed: false, assignmentId, profile }
      }

      const profile = await this.ledger.awardQuestRewardInTransaction({
        assignmentId,
        actorId,
        questCode: assignment.quest.code,
        questVersion: assignment.quest.version,
        amount: assignment.rewardXp,
      }, tx)

      await tx.gamifyQuestAssignment.update({
        where: { id: assignmentId },
        data: { status: 'CLAIMED', claimedAt },
      })

      return { claimed: true, assignmentId, profile }
    })
  }

  async expireAssignments(now = new Date()): Promise<number> {
    const result = await this.db.gamifyQuestAssignment.updateMany({
      where: {
        status: 'IN_PROGRESS',
        expiresAt: { not: null, lte: now },
      },
      data: { status: 'EXPIRED' },
    })
    return result.count
  }

  private async lockAssignment(assignmentId: string, tx: Tx): Promise<void> {
    await tx.$queryRaw`SELECT "id" FROM "GamifyQuestAssignment" WHERE "id" = ${assignmentId} FOR UPDATE`
  }

  private eventFallsWithinQuestWindow(occurredAt: Date, startsAt: Date | null, expiresAt: Date | null): boolean {
    if (startsAt && occurredAt < startsAt) return false
    if (expiresAt && occurredAt >= expiresAt) return false
    return true
  }

}
