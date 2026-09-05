import 'server-only'
import prisma from '@/lib/prisma'
import type { LeadEvidence as DashboardLead } from '../domain/leadEvidence'
import { AURORA_POLICY_VERSION, MIN_ENGAGE_CONFIDENCE } from '@/src/modules/aurora/policy'

// Review prioritization policy; these thresholds do not authorize external actions.
export const LEAD_RECOMMENDATION_POLICY_VERSION = 'v1'
export const REVIEW_WINDOW_DAYS = 7

type RankedLead = Omit<DashboardLead, 'sourceCreatedAt' | 'aurora'> & {
  sourceCreatedAt: Date | null
  observedAt: Date
  decisionId: string | null
  score: number | null
  confidence: number | null
  recommendedAction: string | null
  evaluationStatus: string | null
  reasons: unknown
  policyVersion: string | null
  evaluatedAt: Date | null
  eligible: boolean
}

export class LeadQueryService {
  static async pipeline(userId: string) {
    const [stages, reports, followUps] = await Promise.all([
      prisma.lead.groupBy({ by: ['status'], where: { userId }, _count: { _all: true } }),
      prisma.leadOutcome.groupBy({ by: ['action'], where: { lead: { userId }, evidenceKind: 'CUSTOMER_REPORTED' }, _count: { _all: true } }),
      prisma.lead.findMany({ where: { userId, status: { in: ['CLAIMED', 'CONTACTED', 'REPLIED', 'QUALIFIED'] } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 3,
        select: { id: true, content: true, status: true } }),
    ])
    return { stages: Object.fromEntries(stages.map(row => [row.status, row._count._all])),
      reports: Object.fromEntries(reports.map(row => [row.action, row._count._all])), followUps }
  }

  static async tracked(userId: string) {
    return prisma.lead.findMany({
      where: { userId, status: { in: ['CLAIMED', 'CONTACTED', 'REPLIED', 'QUALIFIED', 'CONVERTED'] } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 50,
      select: { id: true, content: true, status: true, outcomes: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 10,
        select: { id: true, action: true, evidenceKind: true, notes: true, createdAt: true },
      } },
    })
  }

  static async openQueue(userId: string): Promise<DashboardLead[]> {
    // Explicit cross-domain READ projection. Writes remain owned by Leads and Aurora.
    // Latest decision is selected BEFORE ranking; old favorable decisions cannot win.
    const rows = await prisma.$queryRaw<RankedLead[]>`
      WITH candidates AS (
        SELECT l."id", l."platform", l."author", l."content", l."matched", l."url",
          l."sourceCreatedAt", l."observedAt", d."id" AS "decisionId",
          d."finalScore" AS "score", d."confidence", d."recommendedAction",
          d."evaluationStatus", d."reasons", d."policyVersion", d."createdAt" AS "evaluatedAt",
          COALESCE(d."evaluationStatus" = 'LIVE'
            AND d."policyVersion" = ${AURORA_POLICY_VERSION}
            AND d."recommendedAction" = 'ENGAGE'
            AND d."confidence" >= ${MIN_ENGAGE_CONFIDENCE}
            AND d."finalScore" >= 80
            AND l."sourceCreatedAt" BETWEEN CURRENT_TIMESTAMP - ${REVIEW_WINDOW_DAYS} * INTERVAL '1 day' AND CURRENT_TIMESTAMP,
            false) AS "eligible"
        FROM "Lead" l
        LEFT JOIN LATERAL (
          SELECT * FROM "AuroraDecision" d
          WHERE d."opportunityId" = l."id"
          ORDER BY d."createdAt" DESC, d."id" DESC LIMIT 1
        ) d ON true
        WHERE l."userId" = ${userId} AND l."status" IN ('NEW', 'VIEWED')
      )
      SELECT * FROM candidates
      ORDER BY "eligible" DESC,
        CASE WHEN "eligible" THEN "score" ELSE NULL END DESC NULLS LAST,
        "sourceCreatedAt" DESC NULLS LAST, "id" ASC
      LIMIT 24
    `
    return rows.map(row => ({
      id: row.id, platform: row.platform, author: row.author, content: row.content,
      matched: row.matched, url: row.url, sourceCreatedAt: row.sourceCreatedAt?.toISOString() ?? null,
      observedAt: row.observedAt.toISOString(),
      recommendation: {
        policyVersion: LEAD_RECOMMENDATION_POLICY_VERSION,
        eligible: row.eligible,
        reason: row.eligible ? 'RECENT_BUYING_EVIDENCE' : 'MANUAL_REVIEW_REQUIRED',
      },
      aurora: row.decisionId ? {
        decisionId: row.decisionId, score: row.score!, confidence: row.confidence!,
        recommendedAction: row.recommendedAction!, evaluationStatus: row.evaluationStatus!,
        reasons: Array.isArray(row.reasons) ? row.reasons.filter((reason): reason is string => typeof reason === 'string') : [],
        policyVersion: row.policyVersion!, evaluatedAt: row.evaluatedAt!.toISOString(),
        scoreMeaning: 'HEURISTIC_PRIORITY', confidenceMeaning: 'UNCALIBRATED',
      } : null,
    }))
  }
}
