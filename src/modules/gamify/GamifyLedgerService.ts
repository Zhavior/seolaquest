import { Prisma, type PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'
import type { DomainEvent } from '../core/events/DomainEvent'
import { ConflictError, DomainError, NotFoundError } from '../core/infrastructure/errors'
import { AuroraDecisionReader } from './AuroraDecisionReader'
import { GamifyLevelCurve } from './GamifyLevelCurve'
import { DeterministicGamifyRuleEngine } from './GamifyRuleEngine'
import { RewardEligibilityService } from './RewardEligibilityService'
import type { GamifyAwardResult, GamifyRuleEngine, GamifyRuleEvaluation, RewardRejectionCode } from './types'

type Tx = Prisma.TransactionClient
type Db = PrismaClient | Tx

export interface GamifyQuestRewardInput {
  assignmentId: string
  actorId: string
  questCode: string
  questVersion: number
  amount: number
}

export class GamifyLedgerService {
  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly ruleEngine: GamifyRuleEngine = new DeterministicGamifyRuleEngine(),
    private readonly eligibilityService: RewardEligibilityService = new RewardEligibilityService(
      db,
      new AuroraDecisionReader(db.auroraDecision)
    )
  ) {}

  async awardQuestRewardInTransaction(
    input: GamifyQuestRewardInput,
    tx: Tx
  ): Promise<{ userId: string; lifetimeXp: number; level: number; reputation: number }> {
    if (!Number.isInteger(input.amount) || input.amount < 0) {
      throw new DomainError('Quest XP reward must be a nonnegative integer', 'INVALID_QUEST_REWARD')
    }

    await this.ensureProfile(input.actorId, tx)
    if (input.amount === 0) return this.applyProjection(input.actorId, 0, 0, tx)

    const idempotencyKey = `quest-claim:${input.assignmentId}`
    const existing = await tx.gamifyXpTransaction.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    })

    if (existing) return this.applyProjection(input.actorId, 0, 0, tx)

    await tx.gamifyXpTransaction.create({
      data: {
        actorId: input.actorId,
        sourceEventId: `quest-assignment:${input.assignmentId}`,
        targetKey: `quest-assignment:${input.assignmentId}`,
        ruleId: `quest_completion:${input.questCode}`,
        ruleVersion: input.questVersion,
        entryType: 'AWARD',
        amount: input.amount,
        reason: `Quest completed: ${input.questCode}`,
        idempotencyKey,
      },
    })

    return this.applyProjection(input.actorId, input.amount, 0, tx)
  }

  async awardForEvent(event: DomainEvent): Promise<GamifyAwardResult> {
    const rules = this.ruleEngine.evaluate(event)
    if (rules.length === 0) {
      return {
        awarded: false,
        profile: await this.readOrDefaultProfile(event.actorId),
        rejected: [{ ruleId: 'opportunity_discovered', code: 'NO_REWARD_RULE' }],
      }
    }

    const rejected: Array<{ ruleId: GamifyRuleEvaluation['ruleId']; code: RewardRejectionCode }> = []
    const eligibleRules: GamifyRuleEvaluation[] = []

    for (const rule of rules) {
      const eligibility = await this.eligibilityService.validate(event, rule)
      if (eligibility.eligible) {
        eligibleRules.push(rule)
      } else {
        rejected.push({ ruleId: rule.ruleId, code: eligibility.rejectionCode ?? 'NO_REWARD_RULE' })
      }
    }

    if (eligibleRules.length === 0) {
      return {
        awarded: false,
        profile: await this.readOrDefaultProfile(event.actorId),
        rejected,
      }
    }

    const profile = await this.db.$transaction(async (tx) => {
      await this.ensureProfile(event.actorId, tx)

      let xpDelta = 0
      let reputationDelta = 0

      for (const rule of eligibleRules) {
        for (const effect of rule.effects) {
          if (effect.kind === 'XP') {
            const created = await this.createXpAward(rule, effect.amount, tx)
            if (created) xpDelta += effect.amount
          } else {
            const created = await this.createReputationAward(rule, effect.amount, tx)
            if (created) reputationDelta += effect.amount
          }
        }
      }

      return this.applyProjection(event.actorId, xpDelta, reputationDelta, tx)
    })

    return {
      awarded: true,
      profile,
      rejected,
    }
  }

  async reverseXpTransaction(originalTransactionId: string, reason = 'Reward reversed'): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const original = await tx.gamifyXpTransaction.findUnique({
        where: { id: originalTransactionId },
      })
      if (!original) throw new NotFoundError('XP transaction not found')
      if (original.entryType !== 'AWARD') throw new DomainError('Only XP awards can be reversed', 'INVALID_REVERSAL')

      const idempotencyKey = `reversal:${original.id}`
      const existing = await tx.gamifyXpTransaction.findUnique({ where: { idempotencyKey } })
      if (existing) throw new ConflictError('XP transaction was already reversed')

      await tx.gamifyXpTransaction.create({
        data: {
          actorId: original.actorId,
          sourceEventId: original.sourceEventId,
          targetKey: original.targetKey,
          ruleId: original.ruleId,
          ruleVersion: original.ruleVersion,
          entryType: 'REVERSAL',
          amount: -original.amount,
          reason,
          idempotencyKey,
          reversalOfId: original.id,
        },
      })

      await this.applyProjection(original.actorId, -original.amount, 0, tx)
    })
  }

  async reverseReputationTransaction(originalTransactionId: string, reason = 'Reputation reversed'): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const original = await tx.gamifyReputationTransaction.findUnique({
        where: { id: originalTransactionId },
      })
      if (!original) throw new NotFoundError('Reputation transaction not found')
      if (original.entryType !== 'AWARD') throw new DomainError('Only reputation awards can be reversed', 'INVALID_REVERSAL')

      const idempotencyKey = `reversal:${original.id}`
      const existing = await tx.gamifyReputationTransaction.findUnique({ where: { idempotencyKey } })
      if (existing) throw new ConflictError('Reputation transaction was already reversed')

      const profile = await tx.gamifyProfile.findUnique({
        where: { userId: original.actorId },
        select: { reputation: true },
      })
      if (!profile || profile.reputation - original.amount < 0) {
        throw new DomainError('Reputation reversal would make reputation negative', 'REPUTATION_FLOOR')
      }

      await tx.gamifyReputationTransaction.create({
        data: {
          actorId: original.actorId,
          sourceEventId: original.sourceEventId,
          targetKey: original.targetKey,
          ruleId: original.ruleId,
          ruleVersion: original.ruleVersion,
          entryType: 'REVERSAL',
          amount: -original.amount,
          reason,
          idempotencyKey,
          reversalOfId: original.id,
        },
      })

      await this.applyProjection(original.actorId, 0, -original.amount, tx)
    })
  }

  async reconcileProfile(userId: string): Promise<{ userId: string; lifetimeXp: number; level: number; reputation: number }> {
    return this.db.$transaction(async (tx) => {
      await this.ensureProfile(userId, tx)

      const [xp, reputation] = await Promise.all([
        tx.gamifyXpTransaction.aggregate({
          _sum: { amount: true },
          where: { actorId: userId },
        }),
        tx.gamifyReputationTransaction.aggregate({
          _sum: { amount: true },
          where: { actorId: userId },
        }),
      ])

      const lifetimeXp = Math.max(0, xp._sum.amount ?? 0)
      const reputationTotal = Math.max(0, reputation._sum.amount ?? 0)
      const level = GamifyLevelCurve.levelForLifetimeXp(lifetimeXp)

      return tx.gamifyProfile.update({
        where: { userId },
        data: {
          lifetimeXp,
          level,
          reputation: reputationTotal,
        },
        select: { userId: true, lifetimeXp: true, level: true, reputation: true },
      })
    })
  }

  private async createXpAward(rule: GamifyRuleEvaluation, amount: number, tx: Tx): Promise<boolean> {
    const idempotencyKey = this.awardIdempotencyKey(rule)
    try {
      await tx.gamifyXpTransaction.create({
        data: {
          actorId: rule.actorId,
          sourceEventId: rule.sourceEventId,
          targetKey: rule.targetKey,
          ruleId: rule.ruleId,
          ruleVersion: rule.ruleVersion,
          entryType: 'AWARD',
          amount,
          reason: rule.reason,
          idempotencyKey,
        },
      })
      return true
    } catch (error) {
      if (this.isUniqueConstraint(error)) return false
      throw error
    }
  }

  private async createReputationAward(rule: GamifyRuleEvaluation, amount: number, tx: Tx): Promise<boolean> {
    const idempotencyKey = this.awardIdempotencyKey(rule)
    try {
      await tx.gamifyReputationTransaction.create({
        data: {
          actorId: rule.actorId,
          sourceEventId: rule.sourceEventId,
          targetKey: rule.targetKey,
          ruleId: rule.ruleId,
          ruleVersion: rule.ruleVersion,
          entryType: 'AWARD',
          amount,
          reason: rule.reason,
          idempotencyKey,
        },
      })
      return true
    } catch (error) {
      if (this.isUniqueConstraint(error)) return false
      throw error
    }
  }

  private async ensureProfile(userId: string, db: Db): Promise<void> {
    await db.gamifyProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        lifetimeXp: 0,
        level: 1,
        reputation: 0,
      },
    })
  }

  private async applyProjection(
    userId: string,
    xpDelta: number,
    reputationDelta: number,
    tx: Tx
  ): Promise<{ userId: string; lifetimeXp: number; level: number; reputation: number }> {
    const current = await tx.gamifyProfile.findUnique({
      where: { userId },
      select: { lifetimeXp: true, reputation: true },
    })

    if (!current) throw new NotFoundError('Gamify profile not found')

    const lifetimeXp = Math.max(0, current.lifetimeXp + xpDelta)
    const reputation = current.reputation + reputationDelta
    if (reputation < 0) {
      throw new DomainError('Reputation cannot drop below zero', 'REPUTATION_FLOOR')
    }

    return tx.gamifyProfile.update({
      where: { userId },
      data: {
        lifetimeXp,
        level: GamifyLevelCurve.levelForLifetimeXp(lifetimeXp),
        reputation,
      },
      select: { userId: true, lifetimeXp: true, level: true, reputation: true },
    })
  }

  private async readOrDefaultProfile(userId: string): Promise<{ userId: string; lifetimeXp: number; level: number; reputation: number }> {
    const profile = await this.db.gamifyProfile.findUnique({
      where: { userId },
      select: { userId: true, lifetimeXp: true, level: true, reputation: true },
    })
    return profile ?? { userId, lifetimeXp: 0, level: 1, reputation: 0 }
  }

  private awardIdempotencyKey(rule: GamifyRuleEvaluation): string {
    return `award:${rule.actorId}:${rule.sourceEventId}:${rule.ruleId}:${rule.ruleVersion}`
  }

  private isUniqueConstraint(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  }
}
