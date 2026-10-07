import { describe, expect, it } from 'vitest'
import { isPaidCheckoutOpen } from './checkoutGate'

const allOn = {
  ENABLE_BETA_CHECKOUT: 'true',
  SUBSCRIPTION_CHECKOUT_ENABLED: 'true',
  ENABLE_SCAN_WORKER: 'true',
  DURABLE_WORKER_ENABLED: 'true',
}

describe('isPaidCheckoutOpen', () => {
  it('is closed when nothing is configured', () => {
    expect(isPaidCheckoutOpen({})).toBe(false)
  })

  it('is open only when every switch is exactly "true"', () => {
    expect(isPaidCheckoutOpen(allOn)).toBe(true)
    for (const key of Object.keys(allOn)) {
      expect(isPaidCheckoutOpen({ ...allOn, [key]: 'false' })).toBe(false)
      expect(isPaidCheckoutOpen({ ...allOn, [key]: '1' })).toBe(false)
      expect(isPaidCheckoutOpen({ ...allOn, [key]: undefined })).toBe(false)
    }
  })
})
