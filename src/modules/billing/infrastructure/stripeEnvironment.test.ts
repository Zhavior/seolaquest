import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  StripeModeConfigurationError,
  assertStripeSecretKeyMatchesExpectedMode,
  stripeSecretKeyLivemode,
} from './stripeEnvironment'

describe('Stripe secret key modes', () => {
  afterEach(() => vi.unstubAllEnvs())

  it.each([
    ['sk_test_example', false],
    ['rk_test_example', false],
    ['sk_live_example', true],
    ['rk_live_example', true],
  ] as const)('recognizes %s', (secretKey, livemode) => {
    expect(stripeSecretKeyLivemode(secretKey)).toBe(livemode)
  })

  it('rejects unknown secret key formats', () => {
    expect(() => stripeSecretKeyLivemode('pk_live_not_a_secret')).toThrow(StripeModeConfigurationError)
    expect(() => stripeSecretKeyLivemode('secret')).toThrow(StripeModeConfigurationError)
  })

  it('rejects a key from the opposite expected mode', () => {
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    expect(() => assertStripeSecretKeyMatchesExpectedMode('rk_live_example'))
      .toThrow(StripeModeConfigurationError)
  })
})
