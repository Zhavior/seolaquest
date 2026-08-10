import { describe, expect, it } from 'vitest'
import { fingerprintKeywords, fingerprintLeads } from '../serverSnapshot'
import type { DashboardLead } from '../../types'

describe('serverSnapshot fingerprints', () => {
  it('changes when a keyword is added or deactivated', () => {
    const a = fingerprintKeywords([{ id: 'k1', phrase: 'CRM', active: true }])
    const b = fingerprintKeywords([
      { id: 'k1', phrase: 'CRM', active: true },
      { id: 'k2', phrase: 'pricing', active: true },
    ])
    const c = fingerprintKeywords([{ id: 'k1', phrase: 'CRM', active: false }])
    expect(a).not.toBe(b)
    expect(a).not.toBe(c)
  })

  it('changes when Aurora LIVE status appears on a lead', () => {
    const base: DashboardLead = {
      id: 'lead-1',
      platform: 'X',
      author: '@a',
      content: 'hi',
      matched: 'CRM',
      url: 'https://x.com/1',
      sourceCreatedAt: null,
      aurora: null,
    }
    const scored: DashboardLead = {
      ...base,
      aurora: {
        score: 90,
        confidence: 0.8,
        recommendedAction: 'ENGAGE',
        evaluationStatus: 'LIVE',
      },
    }
    expect(fingerprintLeads([base])).not.toBe(fingerprintLeads([scored]))
  })
})
