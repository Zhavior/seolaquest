import 'server-only'

import prisma from '@/lib/prisma'
import { PLAN_CATALOG, isPlanCode, type PlanCode } from '@/src/modules/billing/domain/catalog'
import { buildCapabilityDecision, type CapabilityDecision } from '@/src/modules/billing/domain/capabilities'
import { isCurrentPaidSubscription } from '@/src/modules/billing/domain/entitlements'

export type BillingEntitlements = {
  plan: PlanCode
  planName: string
  subscriptionStatus: string
  paid: boolean
  scanLimit: number
  canUsePaidScans: boolean
  canGenerateAIReplies: boolean
  canExportToCRM: boolean
  capabilities: {
    scanManual: CapabilityDecision
    aiReplyGenerate: CapabilityDecision
    crmExport: CapabilityDecision
  }
}

export class EntitlementService {
  static async forUser(userId: string): Promise<BillingEntitlements> {
    const subscription = await prisma.billingSubscription.findUnique({ where: { userId } })
    const storedPlan = subscription?.plan ?? 'FREE'
    const plan = isPlanCode(storedPlan) ? storedPlan : 'FREE'
    const definition = PLAN_CATALOG[plan]
    const subscriptionStatus = subscription?.status ?? 'inactive'

    const paid = subscription
      ? isCurrentPaidSubscription({
          plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        })
      : false

    const scanManual = buildCapabilityDecision({
      capability: 'SCAN_MANUAL',
      plan,
      subscriptionStatus,
      paid,
      remaining: null,
    })

    const aiReplyGenerate = buildCapabilityDecision({
      capability: 'AI_REPLY_GENERATE',
      plan,
      subscriptionStatus,
      paid,
      remaining: null,
    })

    const crmExport = buildCapabilityDecision({
      capability: 'CRM_EXPORT',
      plan,
      subscriptionStatus,
      paid,
      remaining: null,
    })

    return {
      plan: paid ? plan : 'FREE',
      planName: paid ? definition.name : PLAN_CATALOG.FREE.name,
      subscriptionStatus,
      paid,
      scanLimit: paid ? definition.scanLimit : PLAN_CATALOG.FREE.scanLimit,
      canUsePaidScans: scanManual.allowed,
      canGenerateAIReplies: aiReplyGenerate.allowed,
      canExportToCRM: crmExport.allowed,
      capabilities: {
        scanManual,
        aiReplyGenerate,
        crmExport,
      },
    }
  }
}
