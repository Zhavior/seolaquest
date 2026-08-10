import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import type { DashboardKeyword, DashboardLead, DashboardUser } from '@/features/dashboard/types'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { fetchDashboardLeads } from '@/features/dashboard/server/leads'
import { readHunterProgression } from '@/src/modules/gamify/hunterProgression'

export const dynamic = 'force-dynamic'

export const GET = withApiHandler(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const [keywords, leads, billingSubscription, progression] = await Promise.all([
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
      readHunterProgression(user.id),
    ])

    const dashboardUser: DashboardUser = {
      name: user.name ?? user.email?.split('@')[0] ?? 'Hunter',
      title: user.title ?? 'Lead Hunter',
      xp: progression.xp,
      level: progression.level,
      xpRequired: progression.xpRequired,
      questsRemaining: user.questsRemaining,
      maxCredits: user.maxCredits,
      planLabel: billingSubscription ? `${billingSubscription.plan} / ${billingSubscription.status}` : 'NO ACTIVE PLAN',
    }

    const dashboardKeywords: DashboardKeyword[] = keywords
    const dashboardLeads: DashboardLead[] = leads

    return NextResponse.json({
      ok: true,
      user: dashboardUser,
      keywords: dashboardKeywords,
      leads: dashboardLeads,
    })
  } catch (error) {
    // requestId/userId/path/ip are injected by withApiHandler's AsyncLocalStorage store.
    logger.error(
      { err: error, event: 'dashboard_hydration_failed', outcomeCode: 'DASHBOARD_HYDRATION_FAILED' },
      'Dashboard hydration failed',
    )
    return NextResponse.json(
      {
        ok: false,
        message: 'Could not load dashboard data.',
      },
      { status: 500 },
    )
  }
})
