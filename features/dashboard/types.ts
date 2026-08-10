export type DashboardUser = {
  name: string
  title: string
  xp: number
  level: number
  xpRequired: number
  questsRemaining?: number
  maxCredits?: number
  planLabel?: string
  /**
   * What the account's plan actually permits, resolved server-side by
   * EntitlementService. The UI gates on these instead of on player level so a
   * paying customer is never told a feature they bought is locked.
   */
  entitlements?: DashboardEntitlements
}

export type DashboardEntitlements = {
  canUsePaidScans: boolean
  canGenerateAIReplies: boolean
  canExportToCRM: boolean
}

export type DashboardKeyword = { id: string; phrase: string; active: boolean }

/**
 * Aurora's actual verdict on a lead, or null when it never produced one.
 *
 * `evaluationStatus` is carried rather than reduced to a number because only
 * 'LIVE' means the semantic classifier really ran. A FALLBACK decision still
 * has a `score` — every one in production so far is a flat 50 emitted because
 * the classifier was unreachable — and presenting that as intent would be
 * inventing a measurement.
 */
export type DashboardLeadAurora = {
  score: number
  confidence: number
  recommendedAction: string
  evaluationStatus: string
}

export type DashboardLead = {
  id: string
  platform: string
  author: string
  content: string
  matched: string
  url: string
  sourceCreatedAt: string | null
  aurora: DashboardLeadAurora | null
}

export type AnalyticsData = { day: string; claimed: number; dismissed: number }[]

export type LeaderboardUser = { name: string | null; title: string | null; level: number; xp: number }

// Kept for the existing UI control, but intentionally empty. Test/demo leads
// must never be presented as customer or source data.
export const DEFAULT_DEMO_LEADS: DashboardLead[] = []
