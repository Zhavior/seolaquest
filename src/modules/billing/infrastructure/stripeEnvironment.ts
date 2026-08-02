import 'server-only'

export class StripeModeConfigurationError extends Error {}

export function expectedStripeLivemode() {
  const configured = process.env.STRIPE_LIVEMODE?.trim().toLowerCase()
  if (configured === 'true') return true
  if (configured === 'false') return false
  if (configured) throw new StripeModeConfigurationError('STRIPE_LIVEMODE must be true or false')
  return process.env.NODE_ENV === 'production'
}

export function stripeSecretKeyLivemode(secretKey: string) {
  if (secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_')) return true
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_')) return false
  throw new StripeModeConfigurationError('STRIPE_SECRET_KEY has an unsupported key mode')
}

export function assertStripeSecretKeyMatchesExpectedMode(secretKey: string) {
  const expectedLivemode = expectedStripeLivemode()
  const keyLivemode = stripeSecretKeyLivemode(secretKey)
  if (keyLivemode !== expectedLivemode) {
    throw new StripeModeConfigurationError('STRIPE_SECRET_KEY mode does not match the expected Stripe livemode')
  }
  return expectedLivemode
}
