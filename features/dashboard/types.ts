export type DashboardUser = {
  name: string
  title: string
  xp: number
  level: number
  xpRequired: number
  questsRemaining?: number
  maxCredits?: number
  planLabel?: string
}

export type DashboardKeyword = { id: string; phrase: string; active: boolean }
export type DashboardLead = {
  id: string
  platform: string
  author: string
  content: string
  matched: string
  url: string
  sourceCreatedAt: string | null
}

export type AnalyticsData = { day: string; claimed: number; dismissed: number }[]

export type LeaderboardUser = { name: string | null; title: string | null; level: number; xp: number }

// Kept for the existing UI control, but intentionally empty. Test/demo leads
// must never be presented as customer or source data.
export const DEFAULT_DEMO_LEADS: DashboardLead[] = []
