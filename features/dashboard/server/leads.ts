import 'server-only'

import prisma from '@/lib/prisma'
import type { DashboardLead } from '@/features/dashboard/types'

/** What the feed shows: still actionable, newest source post first. */
const FEED_STATUSES = ['NEW', 'VIEWED'] as const
const FEED_LIMIT = 24

/**
 * The one place a dashboard lead is assembled.
 *
 * Three surfaces render this list — the server-rendered dashboard and two API
 * routes — and each previously built it independently. They agreed only by
 * coincidence, and a lead's Aurora verdict is exactly the field that must not
 * differ between them: one surface showing a score while another shows none is
 * worse than either alone.
 */
export async function fetchDashboardLeads(userId: string): Promise<DashboardLead[]> {
  const leads = await prisma.lead.findMany({
    where: { userId, status: { in: [...FEED_STATUSES] } },
    orderBy: [{ sourceCreatedAt: 'desc' }, { createdAt: 'desc' }],
    take: FEED_LIMIT,
    select: {
      id: true,
      platform: true,
      author: true,
      content: true,
      matched: true,
      url: true,
      sourceCreatedAt: true,
    },
  })

  if (!leads.length) return []

  // A Lead *is* the opportunity, so AuroraDecision.opportunityId holds the lead
  // id (see OpportunityDiscoveredPayloadSchema). Ascending so the Map keeps the
  // newest decision per lead: re-evaluations append rather than overwrite.
  const decisions = await prisma.auroraDecision.findMany({
    where: { opportunityId: { in: leads.map((lead) => lead.id) } },
    orderBy: { createdAt: 'asc' },
    select: {
      opportunityId: true,
      finalScore: true,
      confidence: true,
      recommendedAction: true,
      evaluationStatus: true,
    },
  })
  const latestDecision = new Map(decisions.map((decision) => [decision.opportunityId, decision]))

  return leads.map((lead) => {
    const decision = latestDecision.get(lead.id)
    return {
      ...lead,
      sourceCreatedAt: lead.sourceCreatedAt?.toISOString() ?? null,
      aurora: decision
        ? {
            score: decision.finalScore,
            confidence: decision.confidence,
            recommendedAction: decision.recommendedAction,
            evaluationStatus: decision.evaluationStatus,
          }
        : null,
    }
  })
}
