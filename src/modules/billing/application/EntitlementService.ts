import 'server-only'

import prisma from '@/lib/prisma'
import { PLAN_CATALOG, isPlanCode, type PlanCode } from '@/src/modules/billing/domain/catalog'
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
}

export class EntitlementService {
  static async forUser(userId: string): Promise<BillingEntitlements> {
    const subscription = await prisma.billingSubscription.findUnique({ where: { userId } })
    const storedPlan = subscription?.plan ?? 'FREE'
    const plan = isPlanCode(storedPlan) ? storedPlan : 'FREE'
    const definition = PLAN_CATALOG[plan]
    const paid = subscription ? isCurrentPaidSubscription({
      plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    }) : false

    if (!paid) {
      return {
        plan: 'FREE',
        planName: PLAN_CATALOG.FREE.name,
        subscriptionStatus: subscription?.status ?? 'inactive',
        paid: false,
        scanLimit: PLAN_CATALOG.FREE.scanLimit,
        canUsePaidScans: false,
        canGenerateAIReplies: false,
        canExportToCRM: false,
      }
    }

    return {
      plan,
      planName: definition.name,
      subscriptionStatus: subscription?.status ?? 'inactive',
      paid: true,
      scanLimit: definition.scanLimit,
      canUsePaidScans: true,
      canGenerateAIReplies: true,
      canExportToCRM: true,
    }
  }
}
