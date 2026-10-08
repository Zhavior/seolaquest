import { describe, expect, it } from 'vitest'
import { AURORA_ENGAGE_MIN, AURORA_IGNORE_BELOW } from '@/features/handbook/rules'
import { LEAD_ENGAGE_MIN, LEAD_IGNORE_BELOW, actionLabel, formatScore, liveScore, matchesIntentFilter } from './leadScore'
import type { DashboardLead } from '@/features/dashboard/types'

function lead(aurora: DashboardLead['aurora']): DashboardLead {
  return { id: 'x', platform: 'X', author: 'a', content: 'c', matched: 'm', url: 'https://example.com', sourceCreatedAt: null, aurora }
}

const verdict = (score: number, evaluationStatus: string) => ({ score, confidence: 0.5, recommendedAction: 'REVIEW', evaluationStatus })

describe('leadScore', () => {
  it('keeps the dashboard cutoff equal to the pinned Aurora ENGAGE cutoff', () => {
    expect(LEAD_ENGAGE_MIN).toBe(AURORA_ENGAGE_MIN)
    expect(LEAD_IGNORE_BELOW).toBe(AURORA_IGNORE_BELOW)
  })

  it('writes every score the same way, with a named band', () => {
    expect(formatScore(86.4)).toBe('86/100 · Strong match')
    expect(formatScore(80)).toBe('80/100 · Strong match')
    expect(formatScore(79)).toBe('79/100 · Possible match')
    expect(formatScore(40)).toBe('40/100 · Possible match')
    expect(formatScore(39)).toBe('39/100 · Weak match')
  })

  it('names recommended actions in plain words without hiding unknown ones', () => {
    expect(actionLabel('ENGAGE')).toBe('Worth replying to')
    expect(actionLabel('REVIEW')).toBe('Worth a look')
    expect(actionLabel('NEW_CODE')).toBe('new code')
  })

  it('treats only LIVE verdicts as scores', () => {
    expect(liveScore(lead(verdict(86.4, 'LIVE')))).toBe(86)
    expect(liveScore(lead(verdict(50, 'FALLBACK')))).toBeNull()
    expect(liveScore(lead(null))).toBeNull()
  })

  it('filters by live score', () => {
    const hot = lead(verdict(80, 'LIVE'))
    const warm = lead(verdict(79, 'LIVE'))
    const none = lead(verdict(95, 'FALLBACK'))
    expect([hot, warm, none].filter((l) => matchesIntentFilter(l, 'engage'))).toEqual([hot])
    expect([hot, warm, none].filter((l) => matchesIntentFilter(l, 'unscored'))).toEqual([none])
    expect([hot, warm, none].filter((l) => matchesIntentFilter(l, 'all'))).toHaveLength(3)
  })
})
