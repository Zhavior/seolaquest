import type { DashboardLead } from '@/features/dashboard/types'

/**
 * Aurora's ENGAGE cutoff. Pinned here rather than imported from
 * `features/handbook/rules`, which would pull the gamify engine into the
 * dashboard bundle; leadScore.test.ts checks the two stay equal.
 */
export const LEAD_ENGAGE_MIN = 80

/**
 * Only a LIVE Aurora verdict is a measurement. A FALLBACK decision still carries
 * a score (a flat 50 when the classifier was unreachable), so it counts as none.
 */
export function liveScore(lead: DashboardLead): number | null {
  const aurora = lead.aurora
  if (!aurora || aurora.evaluationStatus !== 'LIVE' || !Number.isFinite(aurora.score)) return null
  return Math.round(aurora.score)
}

export type LeadIntentFilter = 'all' | 'engage' | 'unscored'

export function matchesIntentFilter(lead: DashboardLead, filter: LeadIntentFilter): boolean {
  if (filter === 'all') return true
  const score = liveScore(lead)
  if (filter === 'unscored') return score === null
  return score !== null && score >= LEAD_ENGAGE_MIN
}
