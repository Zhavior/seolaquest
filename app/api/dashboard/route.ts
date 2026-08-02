import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import type { DashboardKeyword, DashboardLead, DashboardUser } from '@/features/dashboard/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireCurrentUser()

    const [keywords, leads, billingSubscription] = await Promise.all([
      prisma.trackedKeyword.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, phrase: true, active: true },
      }),
      prisma.lead.findMany({
        where: { userId: user.id, status: { in: ['NEW', 'VIEWED'] } },
        orderBy: [{ sourceCreatedAt: 'desc' }, { createdAt: 'desc' }],
        take: 24,
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
      prisma.billingSubscription.findUnique({
        where: { userId: user.id },
        select: { plan: true, status: true },
      }),
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
    }

    const dashboardKeywords: DashboardKeyword[] = keywords
    const dashboardLeads: DashboardLead[] = leads.map((lead) => ({
      ...lead,
      sourceCreatedAt: lead.sourceCreatedAt?.toISOString() ?? null,
    }))

    return NextResponse.json({
      ok: true,
      user: dashboardUser,
      keywords: dashboardKeywords,
      leads: dashboardLeads,
    })
  } catch (error) {
    console.error('dashboard hydration failed', error)
    return NextResponse.json(
      {
        ok: false,
        message: 'Could not load dashboard data.',
      },
      { status: 500 },
    )
  }
}
