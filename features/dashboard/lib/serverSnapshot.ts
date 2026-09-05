import type { DashboardKeyword, DashboardLead } from '@/features/dashboard/types'

/**
 * Stable fingerprints of server dashboard props.
 *
 * Used so client mirrors of keywords/leads only adopt a new server snapshot when
 * the measured contents change — not on every RSC identity churn — and so
 * optimistic local dismiss/claim/add is not immediately overwritten by a stale
 * parent render that still carries the previous server list.
 */
export function fingerprintKeywords(keywords: DashboardKeyword[]): string {
  return keywords.map((keyword) => `${keyword.id}:${keyword.active ? '1' : '0'}:${keyword.phrase}`).join('\n')
}

export function fingerprintLeads(leads: DashboardLead[]): string {
  return leads
    .map((lead) => {
      const aurora = lead.aurora
      const auroraKey = aurora
        ? `${aurora.decisionId ?? ""}:${aurora.evaluationStatus}:${aurora.score}:${aurora.recommendedAction}:${lead.recommendation?.eligible ?? false}`
        : 'none'
      return `${lead.id}:${lead.platform}:${auroraKey}`
    })
    .join('\n')
}
