import { PLAN_CATALOG, type PlanCode } from '@/src/modules/billing/domain/catalog'

export type CapabilityKey =
  | 'SCAN_MANUAL'
  | 'AI_REPLY_GENERATE'
  | 'CRM_EXPORT'

export type CapabilityReason =
  | 'ALLOWED'
  | 'PLAN_REQUIRES_UPGRADE'
  | 'SUBSCRIPTION_INACTIVE'
  | 'PLAN_DISABLED'
  | 'UNKNOWN_PLAN'

export type CapabilityDecision = {
  capability: CapabilityKey
  allowed: boolean
  reason: CapabilityReason
  plan: PlanCode
  planName: string
  subscriptionStatus: string
  limit: number | null
  remaining: number | null
}

export type CapabilityMatrix = Record<CapabilityKey, boolean>

const PLAN_CAPABILITIES: Record<PlanCode, CapabilityMatrix> = {
  FREE: {
    SCAN_MANUAL: false,
    AI_REPLY_GENERATE: false,
    CRM_EXPORT: false,
  },
  BETA: {
    SCAN_MANUAL: true,
    AI_REPLY_GENERATE: true,
    CRM_EXPORT: true,
  },
  PRO: {
    SCAN_MANUAL: true,
    AI_REPLY_GENERATE: true,
    CRM_EXPORT: true,
  },
  AGENCY: {
    SCAN_MANUAL: true,
    AI_REPLY_GENERATE: true,
    CRM_EXPORT: true,
  },
}

export function capabilityMatrixForPlan(plan: PlanCode): CapabilityMatrix {
  return PLAN_CAPABILITIES[plan]
}

export function buildCapabilityDecision(input: {
  capability: CapabilityKey
  plan: PlanCode
  subscriptionStatus: string
  paid: boolean
  remaining?: number | null
}): CapabilityDecision {
  const definition = PLAN_CATALOG[input.plan]
  const enabledForPlan = capabilityMatrixForPlan(input.plan)[input.capability]

  if (!definition.enabled && input.plan !== 'FREE') {
    return {
      capability: input.capability,
      allowed: false,
      reason: 'PLAN_DISABLED',
      plan: input.plan,
      planName: definition.name,
      subscriptionStatus: input.subscriptionStatus,
      limit: definition.scanLimit,
      remaining: input.remaining ?? null,
    }
  }

  if (!enabledForPlan) {
    return {
      capability: input.capability,
      allowed: false,
      reason: 'PLAN_REQUIRES_UPGRADE',
      plan: input.plan,
      planName: definition.name,
      subscriptionStatus: input.subscriptionStatus,
      limit: definition.scanLimit,
      remaining: input.remaining ?? null,
    }
  }

  if (input.plan !== 'FREE' && !input.paid) {
    return {
      capability: input.capability,
      allowed: false,
      reason: 'SUBSCRIPTION_INACTIVE',
      plan: input.plan,
      planName: definition.name,
      subscriptionStatus: input.subscriptionStatus,
      limit: definition.scanLimit,
      remaining: input.remaining ?? null,
    }
  }

  return {
    capability: input.capability,
    allowed: true,
    reason: 'ALLOWED',
    plan: input.plan,
    planName: definition.name,
    subscriptionStatus: input.subscriptionStatus,
    limit: definition.scanLimit,
    remaining: input.remaining ?? null,
  }
}
