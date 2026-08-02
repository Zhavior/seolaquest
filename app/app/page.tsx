import nextDynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Loading from '../(app)/loading'
import { type DashboardKeyword, type DashboardLead, type DashboardUser } from '@/features/dashboard/types'

const DashboardClient = nextDynamic(() => import('@/features/dashboard/components/DashboardClient'))

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard | CoQuest',
  description: 'Review saved keywords, durable scan state, and stored source matches.',
}

export default function AppHomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardShellData />
    </Suspense>
  )
}

async function DashboardShellData() {
  const dashboardUser: DashboardUser = {
    name: 'Hunter',
    title: 'Lead Hunter',
    xp: 0,
    level: 1,
    xpRequired: 100,
    questsRemaining: 0,
    maxCredits: 0,
    planLabel: 'LOADING PLAN',
  }

  const dashboardKeywords: DashboardKeyword[] = []
  const dashboardLeads: DashboardLead[] = []

  return (
    <DashboardClient
      key="dashboard-shell"
      dbUser={dashboardUser}
      dbKeywords={dashboardKeywords}
      dbLeads={dashboardLeads}
      dbAnalytics={[]}
      dbLeaderboard={[]}
    />
  )
}
