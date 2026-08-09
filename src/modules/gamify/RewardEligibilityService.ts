import type { PrismaClient } from '@prisma/client'
import type { DomainEvent } from '../core/events/DomainEvent'
import { AuroraDecisionReader } from './AuroraDecisionReader'
import type { GamifyRuleEvaluation, RewardEligibilityResult } from './types'

const SYSTEM_ACTORS = new Set(['system', 'aurora-engine'])
const ACTIONABLE_AURORA_ACTIONS = new Set(['WATCH', 'ENGAGE'])

export interface RewardEligibilityPolicy {
  velocityWindowMs: number
  maxAwardsPerRuleInWindow: number
  dailyXpCap: number
}

const DEFAULT_POLICY: RewardEligibilityPolicy = {
  velocityWindowMs: 60 * 60 * 1000,
  maxAwardsPerRuleInWindow: 20,
  dailyXpCap: 500,
}

type GamifyPrisma = Pick<PrismaClient, 'gamifyXpTransaction'>

function payloadString(event: DomainEvent, key: string): string | null {
  const value = event.payload[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export class RewardEligibilityService {
  constructor(
    private readonly prisma: GamifyPrisma,
    private readonly auroraDecisionReader: AuroraDecisionReader,
    private readonly policy: RewardEligibilityPolicy = DEFAULT_POLICY
  ) {}

  async validate(event: DomainEvent, rule: GamifyRuleEvaluation): Promise<RewardEligibilityResult> {
    if (SYSTEM_ACTORS.has(rule.actorId) || event.source.startsWith('system.')) {
      return { eligible: false, rejectionCode: 'SYSTEM_ACTOR' }
    }

    const duplicate = await this.prisma.gamifyXpTransaction.findUnique({
      where: { idempotencyKey: this.awardIdempotencyKey(rule) },
      select: { id: true },
    })
    if (duplicate) return { eligible: false, rejectionCode: 'DUPLICATE_REWARD' }

    if (rule.targetKey) {
      const repeatTarget = await this.prisma.gamifyXpTransaction.findFirst({
        where: {
          actorId: rule.actorId,
          ruleId: rule.ruleId,
          targetKey: rule.targetKey,
          entryType: 'AWARD',
        },
        select: { id: true },
      })
      if (repeatTarget) return { eligible: false, rejectionCode: 'REPEAT_TARGET' }
    }

    const windowStart = new Date(Date.now() - this.policy.velocityWindowMs)
    const recentCount = await this.prisma.gamifyXpTransaction.count({
      where: {
        actorId: rule.actorId,
        ruleId: rule.ruleId,
        entryType: 'AWARD',
        createdAt: { gte: windowStart },
      },
    })
    if (recentCount >= this.policy.maxAwardsPerRuleInWindow) {
      return { eligible: false, rejectionCode: 'VELOCITY_LIMIT' }
    }

    const xpEffect = rule.effects.find((effect) => effect.kind === 'XP')
    if (xpEffect) {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      const dailyXp = await this.prisma.gamifyXpTransaction.aggregate({
        _sum: { amount: true },
        where: {
          actorId: rule.actorId,
          entryType: 'AWARD',
          createdAt: { gte: today },
        },
      })
      const awardedToday = dailyXp._sum.amount ?? 0
      if (awardedToday + xpEffect.amount > this.policy.dailyXpCap) {
        return { eligible: false, rejectionCode: 'DAILY_XP_CAP' }
      }
    }

    if (rule.requiresAuroraDecision) {
      const decisionId = payloadString(event, 'auroraDecisionId')
      const opportunityId = payloadString(event, 'opportunityId')
      const decision = decisionId
        ? await this.auroraDecisionReader.findById(decisionId)
        : opportunityId
          ? await this.auroraDecisionReader.findLatestForOpportunity(opportunityId)
          : null

      if (!decision) return { eligible: false, rejectionCode: 'AURORA_DECISION_REQUIRED' }
      if (!ACTIONABLE_AURORA_ACTIONS.has(decision.recommendedAction)) {
        return { eligible: false, rejectionCode: 'AURORA_NOT_ACTIONABLE' }
      }
      if (rule.minimumAuroraScore !== undefined && decision.finalScore < rule.minimumAuroraScore) {
        return { eligible: false, rejectionCode: 'AURORA_BELOW_THRESHOLD' }
      }
    }

    return { eligible: true }
  }

  awardIdempotencyKey(rule: GamifyRuleEvaluation): string {
    return `award:${rule.actorId}:${rule.sourceEventId}:${rule.ruleId}:${rule.ruleVersion}`
  }
}
