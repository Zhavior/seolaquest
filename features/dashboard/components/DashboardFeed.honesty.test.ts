import { describe, expect, it } from 'vitest'
import type { DashboardLead } from '@/features/dashboard/types'

/**
 * Mirrors DashboardFeed signal badge rules for unit coverage without mounting the full feed.
 */
function getSignalBadge(lead: DashboardLead): 'LIVE_SCORED' | 'UNSCORED' | 'SCORING_UNAVAILABLE' {
  const aurora = lead.aurora
  if (!aurora) return 'UNSCORED'
  if (aurora.evaluationStatus === 'LIVE') return 'LIVE_SCORED'
  return 'SCORING_UNAVAILABLE'
}

describe('opportunity queue signal badges', () => {
  const base: DashboardLead = {
    id: '1',
    platform: 'X',
    author: '@a',
    content: 'urgent budget pricing demo',
    matched: 'CRM',
    url: 'https://x.com/1',
    sourceCreatedAt: null,
    aurora: null,
  }

  it('does not treat keyword-rich copy as legendary without LIVE Aurora', () => {
    expect(getSignalBadge(base)).toBe('UNSCORED')
  })

  it('marks FALLBACK as scoring unavailable', () => {
    expect(
      getSignalBadge({
        ...base,
        aurora: {
          score: 50,
          confidence: 0,
          recommendedAction: 'REVIEW',
          evaluationStatus: 'FALLBACK',
        },
      })
    ).toBe('SCORING_UNAVAILABLE')
  })

  it('marks LIVE evaluations as live scored', () => {
    expect(
      getSignalBadge({
        ...base,
        aurora: {
          score: 91,
          confidence: 0.8,
          recommendedAction: 'ENGAGE',
          evaluationStatus: 'LIVE',
        },
      })
    ).toBe('LIVE_SCORED')
  })
})
