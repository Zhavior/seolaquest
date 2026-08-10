import nextDynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import AppLoading from './loading'
import { type DashboardKeyword, type DashboardLead, type DashboardUser } from '@/features/dashboard/types'
import { requireCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { EntitlementService } from '@/src/modules/billing/application/EntitlementService'
import { fetchDashboardLeads } from '@/features/dashboard/server/leads'

const DashboardClient = nextDynamic(() => import('@/features/dashboard/components/DashboardClient'))
const FirstQuestBanner = nextDynamic(() => import('@/features/dashboard/components/FirstQuestBanner'))

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Battle Area | SEOlaQuest',
  description: 'Command your Battle Area, manage keyword campaigns, and review active lead intelligence.',
}

export default function AppHomePage() {
  return (
    <Suspense fallback={<AppLoading />}>
      <DashboardShellData />
    </Suspense>
  )
}

async function DashboardShellData() {
  const user = await requireCurrentUser()

  const [keywords, leads, billingSubscription, entitlements] = await Promise.all([
    prisma.trackedKeyword.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, phrase: true, active: true },
    }),
    fetchDashboardLeads(user.id),
    prisma.billingSubscription.findUnique({
      where: { userId: user.id },
      select: { plan: true, status: true },
    }),
    EntitlementService.forUser(user.id),
  ])

  const dashboardUser: DashboardUser = {
    name: user.name ?? user.email?.split('@')[0] ?? 'Hunter',
    title: user.title ?? 'Lead Hunter',
    xp: user.xp,
    level: user.level,
    xpRequired: user.xpRequired,
    questsRemaining: user.questsRemaining,
    maxCredits: user.maxCredits,
    planLabel: billingSubscription ? `${billingSubscription.plan} / ${billingSubscription.status}` : 'NO ACTIVE PLAN',
    entitlements: {
      canUsePaidScans: entitlements.canUsePaidScans,
      canGenerateAIReplies: entitlements.canGenerateAIReplies,
      canExportToCRM: entitlements.canExportToCRM,
    },
  }

  const dashboardKeywords: DashboardKeyword[] = keywords
  const dashboardLeads: DashboardLead[] = leads

  return (
    <>
      <FirstQuestBanner />
      <DashboardClient
        key="dashboard-shell"
        dbUser={dashboardUser}
        dbKeywords={dashboardKeywords}
        dbLeads={dashboardLeads}
        dbAnalytics={[]}
        dbLeaderboard={[]}
      />
    </>
  )
}
