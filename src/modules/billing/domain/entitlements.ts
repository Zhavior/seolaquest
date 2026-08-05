import { PLAN_CATALOG, isPlanCode, type PlanCode } from '@/src/modules/billing/domain/catalog'

const PAID_STATUSES = new Set(['active', 'trialing'])

export function isCurrentPaidSubscription(input: {
  plan: string
  status: string
  currentPeriodEnd: Date | null
}, now = new Date()): input is typeof input & { plan: Exclude<PlanCode, 'FREE'> } {
  if (!isPlanCode(input.plan) || input.plan === 'FREE') return false
  return PLAN_CATALOG[input.plan].enabled &&
    PAID_STATUSES.has(input.status) &&
    input.currentPeriodEnd !== null &&
    input.currentPeriodEnd.getTime() > now.getTime()
}

export type EntitlementCheckResult = {
  allowed: boolean
  reason?: string
  limit?: number
  remaining?: number
}

export type FeatureFlag = 'crm_export' | 'automated_scans' | 'ai_reply' | 'custom_webhooks'

export function canRunScan(user: {
  questsRemaining: number
  subscription?: { plan: string; status: string; currentPeriodEnd: Date | null } | null
}): EntitlementCheckResult {
  if (user.questsRemaining <= 0) {
    return {
      allowed: false,
      reason: 'Insufficient scan credits available. Please top up or upgrade your plan.',
    }
  }

  return { allowed: true }
}

export function canAddKeyword(
  currentCount: number,
  planCode: string = 'FREE',
): EntitlementCheckResult {
  const maxKeywords = planCode === 'BETA' || planCode === 'PRO' || planCode === 'AGENCY' ? 50 : 5
  const remaining = Math.max(0, maxKeywords - currentCount)

  if (currentCount >= maxKeywords) {
    return {
      allowed: false,
      reason: `Keyword limit reached for ${planCode} tier (${maxKeywords} max). Upgrade to track more keywords.`,
      limit: maxKeywords,
      remaining: 0,
    }
  }

  return {
    allowed: true,
    limit: maxKeywords,
    remaining,
  }
}

export function canExportCrm(user: {
  crmWebhookUrl?: string | null
}): EntitlementCheckResult {
  if (!user.crmWebhookUrl || user.crmWebhookUrl.trim() === '') {
    return {
      allowed: false,
      reason: 'No CRM webhook URL configured in settings.',
    }
  }

  return { allowed: true }
}

export function canAccessFeature(
  feature: FeatureFlag,
  subscription?: { plan: string; status: string; currentPeriodEnd: Date | null } | null,
  now = new Date(),
): EntitlementCheckResult {
  const isPaid = subscription ? isCurrentPaidSubscription(subscription, now) : false

  switch (feature) {
    case 'crm_export':
    case 'automated_scans':
    case 'custom_webhooks':
      if (!isPaid) {
        return {
          allowed: false,
          reason: `Feature '${feature}' requires an active paid subscription.`,
        }
      }
      return { allowed: true }
    case 'ai_reply':
      return { allowed: true }
    default:
      return { allowed: false, reason: `Unknown feature flag: ${feature}` }
  }
}

