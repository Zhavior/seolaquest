import type { DashboardKeyword, DashboardLead, DashboardUser } from '@/features/dashboard/types'

export type MissionActionKind =
  | 'add_keyword'
  | 'scan'
  | 'review_leads'
  | 'claim_lead'
  | 'open_billing'
  | 'open_runs'
  | 'wait_scan'

export type MissionTone = 'action' | 'risk' | 'opportunity' | 'neutral'

export type TodaysMission = {
  /** Short RPG-facing label — presentation only */
  label: string
  /** Concrete business objective */
  title: string
  /** Why this matters, using only measured facts */
  why: string
  tone: MissionTone
  action: {
    kind: MissionActionKind
    ctaLabel: string
    /** Set when action targets a specific lead */
    leadId?: string
  }
  confidence: 'measured' | 'inferred' | 'unknown'
}

export type CampaignPulseTrend = 'active' | 'armed' | 'idle' | 'blocked' | 'unknown'

export type CampaignPulse = {
  trend: CampaignPulseTrend
  /** One-line business summary */
  summary: string
  wins: string[]
  risks: string[]
  /** Scan / signal freshness — never invent a timestamp */
  freshness: { state: 'unknown'; detail: string }
  credits: { remaining: number; max: number }
  counts: {
    keywords: number
    activeKeywords: number
    openLeads: number
    liveScoredLeads: number
  }
}

export type MissionControlInput = {
  keywords: DashboardKeyword[]
  leads: DashboardLead[]
  remainingQuests: number
  maxCredits: number
  user: Pick<DashboardUser, 'level' | 'xp' | 'planLabel' | 'entitlements'>
  isScanning?: boolean
}

function isLiveScored(lead: DashboardLead): boolean {
  return lead.aurora?.evaluationStatus === 'LIVE'
}

function pickHighestLiveLead(leads: DashboardLead[]): DashboardLead | null {
  const live = leads.filter(isLiveScored)
  if (!live.length) return null
  return live.reduce((best, lead) =>
    (lead.aurora?.score ?? 0) > (best.aurora?.score ?? 0) ? lead : best
  )
}

/**
 * Picks exactly one next-best action from current dashboard facts.
 * Never invents scores, streaks, ARR, or scan freshness.
 */
export function deriveTodaysMission(input: MissionControlInput): TodaysMission {
  const { keywords, leads, remainingQuests, user, isScanning } = input
  const canScan = user.entitlements?.canUsePaidScans ?? false
  const activeKeywords = keywords.filter((keyword) => keyword.active)
  const keywordCount = keywords.length
  const leadCount = leads.length

  if (isScanning) {
    return {
      label: "Today's Mission",
      title: 'Scan in progress',
      why: 'A durable scan run is already queued or running. Wait for verified results rather than starting another scan.',
      tone: 'neutral',
      action: { kind: 'wait_scan', ctaLabel: 'View scan status' },
      confidence: 'measured',
    }
  }

  if (keywordCount === 0) {
    return {
      label: "Today's Mission",
      title: 'Track your first keyword',
      why: 'No keywords are tracked yet, so the scanner has nothing to match against public posts.',
      tone: 'action',
      action: { kind: 'add_keyword', ctaLabel: 'Add a keyword' },
      confidence: 'measured',
    }
  }

  if (remainingQuests <= 0) {
    return {
      label: "Today's Mission",
      title: canScan ? 'Scan credits are empty' : 'Paid scans are not available on this plan',
      why: canScan
        ? `You have ${keywordCount} tracked keyword${keywordCount === 1 ? '' : 's'}, but 0 scan credits remaining.`
        : `You have ${keywordCount} tracked keyword${keywordCount === 1 ? '' : 's'}, but this account cannot run paid scans yet.`,
      tone: 'risk',
      action: { kind: 'open_billing', ctaLabel: 'Open billing' },
      confidence: 'measured',
    }
  }

  const topLive = pickHighestLiveLead(leads)
  if (topLive && (topLive.aurora?.score ?? 0) >= 80) {
    const score = topLive.aurora!.score
    return {
      label: "Today's Mission",
      title: 'Review a high-scoring live lead',
      why: `Aurora scored a ${topLive.platform} post from ${topLive.author} at ${score}/100 (LIVE). Recommended action: ${topLive.aurora!.recommendedAction}.`,
      tone: 'opportunity',
      action: {
        kind: 'claim_lead',
        ctaLabel: 'Open lead to claim',
        leadId: topLive.id,
      },
      confidence: 'measured',
    }
  }

  if (leadCount > 0) {
    const unscored = leads.filter((lead) => !isLiveScored(lead)).length
    return {
      label: "Today's Mission",
      title: 'Triage your open lead queue',
      why:
        unscored === leadCount
          ? `You have ${leadCount} open lead${leadCount === 1 ? '' : 's'} waiting for review. None currently have a LIVE Aurora score.`
          : `You have ${leadCount} open lead${leadCount === 1 ? '' : 's'} ready for claim, dismiss, reply, or CRM export.`,
      tone: 'action',
      action: { kind: 'review_leads', ctaLabel: 'Review open leads' },
      confidence: 'measured',
    }
  }

  if (activeKeywords.length > 0 && remainingQuests > 0) {
    return {
      label: "Today's Mission",
      title: 'Run a scan for new matches',
      why: `${activeKeywords.length} active keyword${activeKeywords.length === 1 ? '' : 's'} and ${remainingQuests} scan credit${remainingQuests === 1 ? '' : 's'} are ready. Your open lead queue is empty.`,
      tone: 'action',
      action: { kind: 'scan', ctaLabel: 'Start scan' },
      confidence: 'measured',
    }
  }

  return {
    label: "Today's Mission",
    title: 'Check campaign runs',
    why: 'No higher-priority action is clear from the current keyword and lead counts. Inspect durable run history next.',
    tone: 'neutral',
    action: { kind: 'open_runs', ctaLabel: 'Open runs' },
    confidence: 'inferred',
  }
}

export function deriveCampaignPulse(input: MissionControlInput): CampaignPulse {
  const { keywords, leads, remainingQuests, maxCredits, user } = input
  const activeKeywords = keywords.filter((keyword) => keyword.active)
  const liveScoredLeads = leads.filter(isLiveScored)
  const canScan = user.entitlements?.canUsePaidScans ?? false

  const wins: string[] = []
  const risks: string[] = []

  if (leads.length > 0) {
    wins.push(`${leads.length} open lead${leads.length === 1 ? '' : 's'} in queue`)
  }
  if (liveScoredLeads.length > 0) {
    wins.push(`${liveScoredLeads.length} with LIVE Aurora score`)
  }
  if (activeKeywords.length > 0) {
    wins.push(`${activeKeywords.length} active keyword${activeKeywords.length === 1 ? '' : 's'}`)
  }
  if (user.level > 0) {
    wins.push(`Hunter level ${user.level} (${user.xp} XP)`)
  }

  if (keywords.length === 0) {
    risks.push('No keywords tracked')
  }
  if (remainingQuests <= 0) {
    risks.push('No scan credits remaining')
  }
  if (!canScan) {
    risks.push('Paid scans locked by plan entitlements')
  }
  if (leads.length > 0 && liveScoredLeads.length === 0) {
    risks.push('Open leads have no LIVE Aurora score yet')
  }

  let trend: CampaignPulseTrend = 'unknown'
  let summary: string

  if (keywords.length === 0) {
    trend = 'idle'
    summary = 'Campaign is idle — track a keyword before scanning.'
  } else if (remainingQuests <= 0) {
    trend = 'blocked'
    summary = 'Campaign is armed with keywords but blocked on scan credits.'
  } else if (leads.length > 0) {
    trend = 'active'
    summary = 'Campaign has an open lead queue ready for triage.'
  } else if (activeKeywords.length > 0) {
    trend = 'armed'
    summary = 'Keywords and credits are ready; queue is empty pending a scan.'
  } else {
    trend = 'unknown'
    summary = 'Not enough measured movement data to call a directional trend.'
  }

  return {
    trend,
    summary,
    wins: wins.length ? wins : ['No measured wins yet'],
    risks: risks.length ? risks : ['No measured risks right now'],
    freshness: {
      state: 'unknown',
      detail: 'Last scan time is not available on this dashboard payload.',
    },
    credits: {
      remaining: Math.max(0, remainingQuests),
      max: Math.max(0, maxCredits),
    },
    counts: {
      keywords: keywords.length,
      activeKeywords: activeKeywords.length,
      openLeads: leads.length,
      liveScoredLeads: liveScoredLeads.length,
    },
  }
}
