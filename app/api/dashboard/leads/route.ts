import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import type { DashboardLead } from '@/features/dashboard/types'
import { fetchDashboardLeads } from '@/features/dashboard/server/leads'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { logger } from '@/src/modules/core/infrastructure/logger'

export const dynamic = 'force-dynamic'

export const GET = withApiHandler(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const leads = await fetchDashboardLeads(user.id)

    const dashboardLeads: DashboardLead[] = leads

    return NextResponse.json({
      ok: true,
      leads: dashboardLeads,
    })
  } catch (error) {
    // requestId/userId/path/ip are injected by withApiHandler's AsyncLocalStorage store.
    logger.error(
      {
        err: error,
        event: 'dashboard_leads_hydration_failed',
        outcomeCode: 'DASHBOARD_LEADS_HYDRATION_FAILED',
      },
      'Dashboard leads hydration failed',
    )
    return NextResponse.json(
      {
        ok: false,
        message: 'Could not load dashboard leads.',
      },
      { status: 500 },
    )
  }
})
