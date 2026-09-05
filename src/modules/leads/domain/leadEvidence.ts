/**
 * Aurora's actual verdict on a lead, or null when it never produced one.
 *
 * `evaluationStatus` is carried rather than reduced to a number because only
 * 'LIVE' means the semantic classifier really ran. A FALLBACK decision still
 * has a `score` — every one in production so far is a flat 50 emitted because
 * the classifier was unreachable — and presenting that as intent would be
 * inventing a measurement.
 */
export type LeadIntelligenceEvidence = {
  decisionId?: string
  reasons?: string[]
  policyVersion?: string
  evaluatedAt?: string
  scoreMeaning?: 'HEURISTIC_PRIORITY'
  confidenceMeaning?: 'UNCALIBRATED'

  score: number
  confidence: number
  recommendedAction: string
  evaluationStatus: string
}

export type LeadEvidence = {
  id: string
  platform: string
  author: string
  content: string
  matched: string
  url: string
  sourceCreatedAt: string | null
  observedAt?: string
  recommendation?: { policyVersion: string; eligible: boolean; reason: string }
  aurora: LeadIntelligenceEvidence | null
}
