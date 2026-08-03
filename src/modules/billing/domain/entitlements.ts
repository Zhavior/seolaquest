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
