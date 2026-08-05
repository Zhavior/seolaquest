import { describe, expect, it } from 'vitest'
import {
  canAccessFeature,
  canAddKeyword,
  canExportCrm,
  canRunScan,
  isCurrentPaidSubscription,
} from './entitlements'

const now = new Date('2026-07-30T00:00:00.000Z')

describe('paid entitlement snapshot', () => {
  it('accepts an enabled active Beta period that has not expired', () => {
    expect(isCurrentPaidSubscription({
      plan: 'BETA',
      status: 'active',
      currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z'),
    }, now)).toBe(true)
  })

  it.each([
    ['expired period', { plan: 'BETA', status: 'active', currentPeriodEnd: new Date('2026-07-29T23:59:59.000Z') }],
    ['missing period', { plan: 'BETA', status: 'active', currentPeriodEnd: null }],
    ['past due', { plan: 'BETA', status: 'past_due', currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z') }],
    ['disabled plan', { plan: 'PRO', status: 'active', currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z') }],
    ['unknown plan', { plan: 'ENTERPRISE', status: 'active', currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z') }],
  ])('fails closed for %s', (_label, snapshot) => {
    expect(isCurrentPaidSubscription(snapshot, now)).toBe(false)
  })
})

describe('canRunScan', () => {
  it('denies scan when remaining credits is zero or negative', () => {
    expect(canRunScan({ questsRemaining: 0 })).toEqual({
      allowed: false,
      reason: 'Insufficient scan credits available. Please top up or upgrade your plan.',
    })
  })

  it('allows scan when remaining credits > 0', () => {
    expect(canRunScan({ questsRemaining: 5 })).toEqual({ allowed: true })
  })
})

describe('canAddKeyword', () => {
  it('enforces 5 keyword limit for FREE tier', () => {
    expect(canAddKeyword(4, 'FREE')).toEqual({ allowed: true, limit: 5, remaining: 1 })
    expect(canAddKeyword(5, 'FREE')).toEqual({
      allowed: false,
      reason: 'Keyword limit reached for FREE tier (5 max). Upgrade to track more keywords.',
      limit: 5,
      remaining: 0,
    })
  })

  it('allows 50 keywords for BETA tier', () => {
    expect(canAddKeyword(10, 'BETA')).toEqual({ allowed: true, limit: 50, remaining: 40 })
  })
})

describe('canExportCrm', () => {
  it('requires a configured CRM webhook URL', () => {
    expect(canExportCrm({ crmWebhookUrl: '' })).toEqual({
      allowed: false,
      reason: 'No CRM webhook URL configured in settings.',
    })
    expect(canExportCrm({ crmWebhookUrl: 'https://example.com/webhook' })).toEqual({ allowed: true })
  })
})

describe('canAccessFeature', () => {
  it('requires active paid subscription for paid features', () => {
    expect(canAccessFeature('crm_export', null)).toEqual({
      allowed: false,
      reason: "Feature 'crm_export' requires an active paid subscription.",
    })
    expect(
      canAccessFeature('crm_export', {
        plan: 'BETA',
        status: 'active',
        currentPeriodEnd: new Date('2026-08-30T00:00:00.000Z'),
      }, now),
    ).toEqual({ allowed: true })
  })

  it('allows free features like ai_reply', () => {
    expect(canAccessFeature('ai_reply', null)).toEqual({ allowed: true })
  })
})

