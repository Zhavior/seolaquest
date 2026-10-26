import type { DashboardKeyword, DashboardLead, DashboardUser } from '@/features/dashboard/types'
import { SCORE_NOTE, actionLabel, formatScore } from '@/features/dashboard/lib/leadScore'

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
  /** The optional game layer (Settings). Level and XP are only mentioned when on. */
  gameMode?: boolean
}

function isLiveScored(lead: DashboardLead): boolean {
  return lead.aurora?.evaluationStatus === 'LIVE'
}

function pickHighestLiveLead(leads: DashboardLead[]): DashboardLead | null {
  const live = leads.filter(lead => isLiveScored(lead) && lead.recommendation?.eligible === true)
  if (!live.length) return null
  return live.reduce((best, lead) =>
    (lead.aurora?.score ?? 0) > (best.aurora?.score ?? 0) ? lead : best
  )
}

/**
 * Picks exactly one next-best action from current dashboard facts.
 * Never invents scores, streaks, ARR, or scan freshness.
 *
 * Leads come before credits: a new free account has sample leads and no
 * credits, and its first step should be practising on a lead, not billing.
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
      title: 'A scan is running',
      why: 'A scan is already running. New matches will appear in your lead list when it finishes.',
      tone: 'neutral',
      action: { kind: 'wait_scan', ctaLabel: 'See scan progress' },
      confidence: 'measured',
    }
  }

  if (keywordCount === 0) {
    return {
      label: "Today's Mission",
      title: 'Add your first keyword',
      why: 'Add a phrase your buyers use, like "looking for a CRM". We use it to find posts that match.',
      tone: 'action',
      action: { kind: 'add_keyword', ctaLabel: 'Add a keyword' },
      confidence: 'measured',
    }
  }

  const topLive = pickHighestLiveLead(leads)
  if (topLive && (topLive.aurora?.score ?? 0) >= 80) {
    const score = topLive.aurora!.score
    return {
      label: "Today's Mission",
      title: 'Look at your best lead',
      why: `A ${topLive.platform} post from ${topLive.author} scored ${formatScore(score)}. ${actionLabel(topLive.aurora!.recommendedAction)}. ${SCORE_NOTE}`,
      tone: 'opportunity',
      action: {
        kind: 'claim_lead',
        ctaLabel: 'Open this lead',
        leadId: topLive.id,
      },
      confidence: 'inferred',
    }
  }

  if (leadCount > 0) {
    const unscored = leads.filter((lead) => !isLiveScored(lead)).length
    const plural = leadCount === 1 ? '' : 's'
    return {
      label: "Today's Mission",
      title: `Go through your ${leadCount} lead${plural}`,
      why:
        unscored === leadCount
          ? `You have ${leadCount} lead${plural} to look at. None have a score yet, so read each one and decide.`
          : `You have ${leadCount} lead${plural} to look at. For each one, save it to follow up, draft a reply, or dismiss it.`,
      tone: 'action',
      action: { kind: 'review_leads', ctaLabel: 'Go to leads' },
      confidence: 'measured',
    }
  }

  if (remainingQuests <= 0) {
    return {
      label: "Today's Mission",
      title: canScan ? 'You are out of scan credits' : 'Your plan does not include scans',
      why: canScan
        ? 'Each scan uses one credit, and you have none left. Your keywords are saved.'
        : 'Your keywords are saved, but this plan cannot run scans yet.',
      tone: 'risk',
      action: { kind: 'open_billing', ctaLabel: 'See plans' },
      confidence: 'measured',
    }
  }

  if (activeKeywords.length > 0) {
    return {
      label: "Today's Mission",
      title: 'Scan for new posts',
      why: `You have no leads to look at. A scan checks your ${activeKeywords.length} keyword${activeKeywords.length === 1 ? '' : 's'} for new posts. You have ${remainingQuests} scan credit${remainingQuests === 1 ? '' : 's'}.`,
      tone: 'action',
      action: { kind: 'scan', ctaLabel: 'Start a scan' },
      confidence: 'measured',
    }
  }

  return {
    label: "Today's Mission",
    title: 'Check your past scans',
    why: 'Nothing needs you right now. Your past scans show what was found and when.',
    tone: 'neutral',
    action: { kind: 'open_runs', ctaLabel: 'See past scans' },
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
    wins.push(`${leads.length} lead${leads.length === 1 ? '' : 's'} to look at`)
  }
  if (liveScoredLeads.length > 0) {
    wins.push(`${liveScoredLeads.length} with a score`)
  }
  if (activeKeywords.length > 0) {
    wins.push(`${activeKeywords.length} active keyword${activeKeywords.length === 1 ? '' : 's'}`)
  }
  if (input.gameMode && user.level > 0) {
    wins.push(`Level ${user.level} (${user.xp} XP)`)
  }

  if (keywords.length === 0) {
    risks.push('No keywords yet')
  }
  if (remainingQuests <= 0) {
    risks.push('No scan credits left')
  }
  if (!canScan) {
    risks.push('Your plan does not include scans')
  }
  if (leads.length > 0 && liveScoredLeads.length === 0) {
    risks.push('Your leads have no score yet')
  }

  let trend: CampaignPulseTrend = 'unknown'
  let summary: string

  if (keywords.length === 0) {
    trend = 'idle'
    summary = 'Add a keyword to get started.'
  } else if (leads.length > 0) {
    trend = 'active'
    summary = 'You have leads to look at.'
  } else if (remainingQuests <= 0) {
    trend = 'blocked'
    summary = 'Your keywords are saved, but you have no scan credits.'
  } else if (activeKeywords.length > 0) {
    trend = 'armed'
    summary = 'Ready to scan. No leads to look at yet.'
  } else {
    trend = 'unknown'
    summary = 'Not enough activity yet to show a trend.'
  }

  return {
    trend,
    summary,
    wins: wins.length ? wins : ['Nothing yet'],
    risks: risks.length ? risks : ['Nothing needs fixing'],
    freshness: {
      state: 'unknown',
      detail: 'Last scan time is not available here yet.',
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
