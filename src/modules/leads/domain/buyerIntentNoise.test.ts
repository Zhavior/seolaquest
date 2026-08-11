import { describe, expect, it } from 'vitest'
import { detectBuyerIntentNoise, isBuyerIntentNoise } from './buyerIntentNoise'

describe('detectBuyerIntentNoise', () => {
  it('keeps genuine CRM buyer intent without a cashtag', () => {
    expect(
      detectBuyerIntentNoise('#LOOKING FOR CRM — need something for a 12-person sales team'),
    ).toBeNull()
    expect(isBuyerIntentNoise('Anyone have a good CRM recommendation?')).toBe(false)
  })

  it('drops stock-ticker technical analysis that matches CRM keywords', () => {
    const hit = detectBuyerIntentNoise(
      '$CRM bounced perfectly from the AVWAP channel near the swing low into ATHs',
    )
    expect(hit?.reason).toBe('TRADING_NOISE')
  })

  it('does not treat bare POC as trading noise (proof-of-concept buyers)', () => {
    expect(
      detectBuyerIntentNoise('Looking for a CRM to run a POC with our sales team next quarter'),
    ).toBeNull()
  })

  it('drops job listings', () => {
    expect(
      detectBuyerIntentNoise('HIRING Now B2B SaaS Sales Executive. Salary: $120k. Location: Remote')
        ?.reason,
    ).toBe('JOB_LISTING')
    expect(
      detectBuyerIntentNoise('Job Title: Lead Generation Specialist — apply today')?.reason,
    ).toBe('JOB_LISTING')
  })

  it('drops Discord invite promo spam', () => {
    expect(
      detectBuyerIntentNoise('Join our Discord for free alpha signals https://discord.gg/abc123')
        ?.reason,
    ).toBe('PROMO_SPAM')
  })
})
