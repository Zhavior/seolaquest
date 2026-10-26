import type { DashboardLead } from '@/features/dashboard/types'

/**
 * Aurora's ENGAGE cutoff. Pinned here rather than imported from
 * `features/handbook/rules`, which would pull the gamify engine into the
 * dashboard bundle; leadScore.test.ts checks the two stay equal.
 */
export const LEAD_ENGAGE_MIN = 80

/** Aurora's IGNORE cutoff, pinned the same way as LEAD_ENGAGE_MIN. */
export const LEAD_IGNORE_BELOW = 40

/** Shown wherever a score is, so nobody reads 85 as an 85% chance of a sale. */
export const SCORE_NOTE = 'Scores are estimates of fit, not a prediction of a sale.'

/**
 * One way to write a score everywhere: "85/100 · Strong match". The band names
 * follow Aurora's own ENGAGE / WATCH / IGNORE tiers, in plain words.
 */
export function scoreBand(score: number): 'Strong match' | 'Possible match' | 'Weak match' {
  if (score >= LEAD_ENGAGE_MIN) return 'Strong match'
  if (score < LEAD_IGNORE_BELOW) return 'Weak match'
  return 'Possible match'
}

export function formatScore(score: number): string {
  const rounded = Math.round(score)
  return `${rounded}/100 · ${scoreBand(rounded)}`
}

const ACTION_LABEL: Record<string, string> = {
  ENGAGE: 'Worth replying to',
  REVIEW: 'Worth a look',
  WATCH: 'Worth a look',
  IGNORE: 'Probably skip',
  SKIP: 'Probably skip',
}

/** Aurora's recommended action in plain words; unknown codes are lower-cased, not hidden. */
export function actionLabel(action: string): string {
  return ACTION_LABEL[action.toUpperCase()] ?? action.toLowerCase().replace(/_/g, ' ')
}

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
