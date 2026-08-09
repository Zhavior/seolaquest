import type { DomainEvent } from '../core/events/DomainEvent'

export type GamifyEntryType = 'AWARD' | 'REVERSAL'

export type GamifyRuleId =
  | 'opportunity_discovered'
  | 'opportunity_engaged'
  | 'lead_converted'
  | 'aurora_feedback_quality'

export type GamifyEffectKind = 'XP' | 'REPUTATION'

export interface GamifyEffect {
  kind: GamifyEffectKind
  amount: number
}

export interface GamifyRuleEvaluation {
  ruleId: GamifyRuleId
  ruleVersion: number
  sourceEventId: string
  actorId: string
  targetKey: string
  reason: string
  effects: GamifyEffect[]
  requiresAuroraDecision: boolean
  minimumAuroraScore?: number
}

export interface GamifyRuleEngine {
  evaluate(event: DomainEvent): GamifyRuleEvaluation[]
}

export type RewardRejectionCode =
  | 'NO_REWARD_RULE'
  | 'SYSTEM_ACTOR'
  | 'DUPLICATE_REWARD'
  | 'REPEAT_TARGET'
  | 'VELOCITY_LIMIT'
  | 'DAILY_XP_CAP'
  | 'AURORA_DECISION_REQUIRED'
  | 'AURORA_BELOW_THRESHOLD'
  | 'AURORA_NOT_ACTIONABLE'

export interface RewardEligibilityResult {
  eligible: boolean
  rejectionCode?: RewardRejectionCode
}

export interface GamifyAwardResult {
  awarded: boolean
  profile: {
    userId: string
    lifetimeXp: number
    level: number
    reputation: number
  }
  rejected: Array<{
    ruleId: GamifyRuleId
    code: RewardRejectionCode
  }>
}
