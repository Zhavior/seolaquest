import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  stripeConstructor: vi.fn(),
  requireCurrentUser: vi.fn(),
  findSubscription: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('stripe', () => ({
  default: class StripeMock {
    constructor(secretKey: string) {
      mocks.stripeConstructor(secretKey)
    }
  },
}))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: {
    billingSubscription: { findUnique: mocks.findSubscription },
  },
}))

import { BillingService } from './BillingService'

describe('BillingService Stripe mode boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'user_1', email: 'hunter@example.com' })
    mocks.findSubscription.mockResolvedValue(null)
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('STRIPE_PRICE_BETA', 'price_beta')
    vi.stubEnv('NEXTAUTH_URL', 'https://app.example.com')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('rejects test credentials before constructing a live-mode Checkout client', async () => {
    vi.stubEnv('STRIPE_LIVEMODE', 'true')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_cross_mode')

    await expect(BillingService.createCheckout('BETA')).resolves.toEqual({
      ok: false,
      message: 'Checkout is unavailable. No charge was made.',
    })
    expect(mocks.stripeConstructor).not.toHaveBeenCalled()
  })

  it('rejects an unknown secret-key format before constructing a Checkout client', async () => {
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    vi.stubEnv('STRIPE_SECRET_KEY', 'not_a_stripe_secret')

    await expect(BillingService.createCheckout('BETA')).resolves.toMatchObject({ ok: false })
    expect(mocks.stripeConstructor).not.toHaveBeenCalled()
  })

  it('fails closed before constructing Stripe when the durable worker release gate is off', async () => {
    vi.stubEnv('STRIPE_LIVEMODE', 'true')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_not_constructed')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'false')

    await expect(BillingService.createCheckout('BETA')).resolves.toEqual({
      ok: false,
      message: 'Subscription checkout is temporarily unavailable. No charge was made.',
    })
    expect(mocks.stripeConstructor).not.toHaveBeenCalled()
    expect(mocks.findSubscription).not.toHaveBeenCalled()
  })
})
