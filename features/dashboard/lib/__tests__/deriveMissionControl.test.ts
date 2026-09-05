import { describe, expect, it } from 'vitest'
import {
  deriveCampaignPulse,
  deriveTodaysMission,
  type MissionControlInput,
} from '../deriveMissionControl'
import type { DashboardLead, DashboardUser } from '../../types'

const baseUser: Pick<DashboardUser, 'level' | 'xp' | 'planLabel' | 'entitlements'> = {
  level: 3,
  xp: 400,
  planLabel: 'STARTER / active',
  entitlements: {
    canUsePaidScans: true,
    canGenerateAIReplies: true,
    canExportToCRM: true,
  },
}

function input(partial: Partial<MissionControlInput> = {}): MissionControlInput {
  return {
    keywords: [],
    leads: [],
    remainingQuests: 5,
    maxCredits: 10,
    user: baseUser,
    isScanning: false,
    ...partial,
  }
}

function lead(overrides: Partial<DashboardLead> = {}): DashboardLead {
  return {
    id: 'lead-1',
    platform: 'X',
    author: '@buyer',
    content: 'Looking for a CRM',
    matched: 'CRM',
    url: 'https://x.com/1',
    sourceCreatedAt: '2026-08-10T12:00:00.000Z',
    aurora: null,
    ...overrides,
  }
}

describe('deriveTodaysMission', () => {
  it('asks for a keyword when none are tracked', () => {
    const mission = deriveTodaysMission(input())
    expect(mission.action.kind).toBe('add_keyword')
    expect(mission.confidence).toBe('measured')
    expect(mission.why).toMatch(/no keywords/i)
  })

  it('routes to billing when credits are empty', () => {
    const mission = deriveTodaysMission(
      input({
        keywords: [{ id: 'k1', phrase: 'looking for CRM', active: true }],
        remainingQuests: 0,
      })
    )
    expect(mission.action.kind).toBe('open_billing')
    expect(mission.tone).toBe('risk')
  })

  it('prioritizes a LIVE high-scoring lead for claim', () => {
    const mission = deriveTodaysMission(
      input({
        keywords: [{ id: 'k1', phrase: 'CRM', active: true }],
        leads: [
          lead({
            id: 'hot',
            recommendation: { eligible: true, policyVersion: 'v1', reason: 'RECENT_BUYING_EVIDENCE' },
            aurora: {
              score: 91,
              confidence: 0.8,
              recommendedAction: 'ENGAGE',
              evaluationStatus: 'LIVE',
            },
          }),
        ],
      })
    )
    expect(mission.action.kind).toBe('claim_lead')
    expect(mission.action.leadId).toBe('hot')
    expect(mission.why).toMatch(/91\/100/)
    expect(mission.why).toMatch(/ENGAGE/)
  })

  it('does not treat FALLBACK aurora as a scored opportunity', () => {
    const mission = deriveTodaysMission(
      input({
        keywords: [{ id: 'k1', phrase: 'CRM', active: true }],
        leads: [
          lead({
            aurora: {
              score: 50,
              confidence: 0,
              recommendedAction: 'REVIEW',
              evaluationStatus: 'FALLBACK',
            },
          }),
        ],
      })
    )
    expect(mission.action.kind).toBe('review_leads')
    expect(mission.why).toMatch(/none currently have a LIVE Aurora score/i)
  })

  it('recommends a scan when keywords and credits exist but the queue is empty', () => {
    const mission = deriveTodaysMission(
      input({
        keywords: [{ id: 'k1', phrase: 'CRM', active: true }],
        leads: [],
        remainingQuests: 3,
      })
    )
    expect(mission.action.kind).toBe('scan')
    expect(mission.action.ctaLabel).toMatch(/scan/i)
  })

  it('surfaces wait state while a scan modal is active', () => {
    const mission = deriveTodaysMission(
      input({
        keywords: [{ id: 'k1', phrase: 'CRM', active: true }],
        isScanning: true,
      })
    )
    expect(mission.action.kind).toBe('wait_scan')
  })
})

describe('deriveCampaignPulse', () => {
  it('never invents scan freshness timestamps', () => {
    const pulse = deriveCampaignPulse(
      input({
        keywords: [{ id: 'k1', phrase: 'CRM', active: true }],
        leads: [lead()],
      })
    )
    expect(pulse.freshness.state).toBe('unknown')
    expect(pulse.freshness.detail).toMatch(/not available/i)
  })

  it('marks blocked when keywords exist but credits do not', () => {
    const pulse = deriveCampaignPulse(
      input({
        keywords: [{ id: 'k1', phrase: 'CRM', active: true }],
        remainingQuests: 0,
      })
    )
    expect(pulse.trend).toBe('blocked')
    expect(pulse.risks.some((risk) => /credits/i.test(risk))).toBe(true)
  })

  it('reports measured lead and keyword counts', () => {
    const pulse = deriveCampaignPulse(
      input({
        keywords: [
          { id: 'k1', phrase: 'CRM', active: true },
          { id: 'k2', phrase: 'pricing', active: false },
        ],
        leads: [
          lead({ id: 'a' }),
          lead({
            id: 'b',
            aurora: {
              score: 88,
              confidence: 0.9,
              recommendedAction: 'ENGAGE',
              evaluationStatus: 'LIVE',
            },
          }),
        ],
      })
    )
    expect(pulse.counts).toEqual({
      keywords: 2,
      activeKeywords: 1,
      openLeads: 2,
      liveScoredLeads: 1,
    })
    expect(pulse.trend).toBe('active')
  })
})
