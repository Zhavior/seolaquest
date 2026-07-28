import DashboardClient, { type DashboardKeyword, type DashboardLead, type DashboardUser } from './DashboardClient'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await requireCurrentUser()
  const [keywords, leads] = await Promise.all([
    prisma.trackedKeyword.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, phrase: true, active: true },
    }),
    prisma.lead.findMany({
      where: { userId: user.id, status: { in: ['NEW', 'VIEWED'] } },
      orderBy: [{ sourceCreatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 50,
      select: {
        id: true,
        platform: true,
        author: true,
        content: true,
        matched: true,
        url: true,
        sourceCreatedAt: true,
      },
    }),
  ])

  const dashboardUser: DashboardUser = {
    name: user.name ?? user.email?.split('@')[0] ?? 'Hunter',
    title: user.title,
    xp: user.xp,
    level: user.level,
    xpRequired: user.xpRequired,
  }
  const dashboardKeywords: DashboardKeyword[] = keywords
  const dashboardLeads: DashboardLead[] = leads.map((lead) => ({
    ...lead,
    sourceCreatedAt: lead.sourceCreatedAt?.toISOString() ?? null,
  }))

  return <DashboardClient dbUser={dashboardUser} dbKeywords={dashboardKeywords} dbLeads={dashboardLeads} />
}
