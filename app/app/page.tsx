import nextDynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Loading from '../(app)/loading'
import { type DashboardKeyword, type DashboardLead, type DashboardUser } from '@/features/dashboard/types'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import { getAnalyticsAction, getLeaderboardAction } from '@/features/guild/actions'

const DashboardClient = nextDynamic(() => import('@/features/dashboard/components/DashboardClient'))

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard | CoQuest',
  description: 'Review saved keywords, durable scan state, and stored source matches.',
}

export default function AppHomePage() {
  return <Suspense fallback={<Loading />}><DashboardData /></Suspense>
}

async function DashboardData() {
  const user = await requireCurrentUser()
  const [keywords, leads, analyticsData, leaderboardData, billingSubscription] = await Promise.all([
    prisma.trackedKeyword.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, select: { id: true, phrase: true, active: true } }),
    prisma.lead.findMany({ where: { userId: user.id, status: { in: ['NEW', 'VIEWED'] } }, orderBy: [{ sourceCreatedAt: 'desc' }, { createdAt: 'desc' }], take: 50, select: { id: true, platform: true, author: true, content: true, matched: true, url: true, sourceCreatedAt: true } }),
    getAnalyticsAction(),
    getLeaderboardAction(),
    prisma.billingSubscription.findUnique({ where: { userId: user.id }, select: { plan: true, status: true } }),
  ])

  const dashboardUser: DashboardUser = {
    name: user.name ?? user.email?.split('@')[0] ?? 'Hunter',
    title: user.title ?? 'Lead Hunter',
    xp: user.xp, level: user.level, xpRequired: user.xpRequired,
    questsRemaining: user.questsRemaining, maxCredits: user.maxCredits,
    planLabel: billingSubscription ? `${billingSubscription.plan} / ${billingSubscription.status}` : 'NO ACTIVE PLAN',
  }
  const dashboardKeywords: DashboardKeyword[] = keywords
  const dashboardLeads: DashboardLead[] = leads.map((lead) => ({ ...lead, sourceCreatedAt: lead.sourceCreatedAt?.toISOString() ?? null }))
  const dashboardVersion = [
    user.updatedAt.toISOString(),
    ...dashboardKeywords.map((keyword) => `${keyword.id}:${keyword.active}`),
    ...dashboardLeads.map((lead) => lead.id),
  ].join('|')
  return <DashboardClient key={dashboardVersion} dbUser={dashboardUser} dbKeywords={dashboardKeywords} dbLeads={dashboardLeads} dbAnalytics={analyticsData} dbLeaderboard={leaderboardData} />
}
