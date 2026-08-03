import type Stripe from 'stripe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  findSubscription: vi.fn(),
  upsertSubscription: vi.fn(),
  findIntent: vi.fn(),
  createIntent: vi.fn(),
  findIntentOrThrow: vi.fn(),
  updateIntent: vi.fn(),
  createStripeSession: vi.fn(),
  retrieveStripeSession: vi.fn(),
  expireStripeSession: vi.fn(),
  listStripeSubscriptions: vi.fn(),
  createStripeCustomer: vi.fn(),
  deleteStripeCustomer: vi.fn(),
  createPortalSession: vi.fn(),
  withDeletionLock: vi.fn(),
  buildBillingViewModel: vi.fn(),
  recordBillingEvent: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = { sessions: {
      create: mocks.createStripeSession,
      retrieve: mocks.retrieveStripeSession,
      expire: mocks.expireStripeSession,
    } }
    subscriptions = { list: mocks.listStripeSubscriptions }
    customers = { create: mocks.createStripeCustomer, del: mocks.deleteStripeCustomer }
    billingPortal = { sessions: { create: mocks.createPortalSession } }
  },
}))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('./analytics', () => ({
  BILLING_EVENTS: {
    checkoutStartRequested: 'billing_checkout_start_requested',
    checkoutOpened: 'billing_checkout_opened',
    checkoutBlocked: 'billing_checkout_blocked',
    checkoutFailed: 'billing_checkout_failed',
    portalOpened: 'billing_portal_opened',
    portalFailed: 'billing_portal_failed',
  },
  recordBillingEvent: mocks.recordBillingEvent,
}))
vi.mock('./viewModel', () => ({ buildBillingViewModel: mocks.buildBillingViewModel }))
vi.mock('@/src/modules/lifecycle/application/DeletionBillingBarrier', () => ({
  deletionBlocksBilling: (state: { request: unknown; audit: unknown }) => Boolean(state.request || state.audit),
  withUserDeletionLock: mocks.withDeletionLock,
}))
vi.mock('@/lib/prisma', () => ({
  default: {
    billingSubscription: {
      findUnique: mocks.findSubscription,
      upsert: mocks.upsertSubscription,
    },
    checkoutIntent: {
      findUnique: mocks.findIntent,
      findUniqueOrThrow: mocks.findIntentOrThrow,
      create: mocks.createIntent,
      update: mocks.updateIntent,
    },
  },
}))

import { createCheckoutAction, createManaCheckoutAction } from './actions'
import { BILLING_TESTING } from '@/src/modules/billing/application/BillingService'

describe('billing server actions and checkout recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    mocks.requireCurrentUser.mockResolvedValue({
      id: 'user_1',
      email: 'hunter@example.com',
      questsRemaining: 0,
      maxCredits: 0,
    })
    mocks.findSubscription.mockResolvedValue(null)
    mocks.listStripeSubscriptions.mockResolvedValue({ data: [] })
    mocks.createStripeCustomer.mockResolvedValue({ id: 'cus_1' })
    mocks.deleteStripeCustomer.mockResolvedValue({ id: 'cus_1', deleted: true })
    mocks.expireStripeSession.mockResolvedValue({ id: 'cs_1', status: 'expired' })
    mocks.upsertSubscription.mockResolvedValue({ stripeCustomerId: 'cus_1' })
    mocks.updateIntent.mockResolvedValue({})
    mocks.withDeletionLock.mockImplementation(async (_userId, callback) => callback({
      billingSubscription: {
        findUnique: mocks.findSubscription,
        upsert: mocks.upsertSubscription,
      },
      checkoutIntent: {
        findUnique: mocks.findIntent,
        findUniqueOrThrow: mocks.findIntentOrThrow,
        create: mocks.createIntent,
        update: mocks.updateIntent,
      },
    }, { subjectDigest: 'digest', request: null, audit: null }))
    mocks.buildBillingViewModel.mockResolvedValue({
      status: 'free',
      availability: { checkout: { state: 'available', label: 'Checkout available' } },
    })
  })

  afterEach(() => vi.unstubAllEnvs())

  it('rejects invalid, free, disabled, and invented catalog choices at the direct action boundary', async () => {
    await expect(createCheckoutAction('FREE')).resolves.toMatchObject({ ok: false, message: 'Invalid plan.' })
    await expect(createCheckoutAction('PRO')).resolves.toMatchObject({ ok: false, message: 'That plan is not available yet.' })
    await expect(createCheckoutAction('ENTERPRISE')).resolves.toMatchObject({ ok: false, message: 'Invalid plan.' })
    await expect(createManaCheckoutAction('bargain')).resolves.toMatchObject({ ok: false, message: 'Invalid potion.' })
    expect(mocks.findSubscription).not.toHaveBeenCalled()
  })

  it('blocks direct creation when an active Stripe subscription is already linked', async () => {
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    mocks.findSubscription.mockResolvedValue({ stripeSubscriptionId: 'sub_1', status: 'active' })
    await expect(createCheckoutAction('BETA')).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('already active'),
    })
  })

  it('refuses checkout before creating Stripe resources when deletion is frozen', async () => {
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_checkout')
    vi.stubEnv('STRIPE_PRICE_BETA', 'price_beta')
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
    mocks.withDeletionLock.mockImplementation(async (_userId, callback) => callback({
      billingSubscription: { findUnique: mocks.findSubscription, upsert: mocks.upsertSubscription },
      checkoutIntent: {
        findUnique: mocks.findIntent,
        findUniqueOrThrow: mocks.findIntentOrThrow,
        create: mocks.createIntent,
        update: mocks.updateIntent,
      },
    }, {
      subjectDigest: 'digest',
      request: { id: 'delete_1', status: 'AWAITING_IDENTITY_DELETE' },
      audit: null,
    }))

    await expect(createCheckoutAction('BETA')).resolves.toEqual({
      ok: false,
      message: 'Checkout is unavailable while account deletion is pending. No charge was made.',
    })
    expect(mocks.createStripeCustomer).not.toHaveBeenCalled()
    expect(mocks.createStripeSession).not.toHaveBeenCalled()
  })

  it('keeps subscription checkout default-off even for Beta', async () => {
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'false')
    await expect(createCheckoutAction('BETA')).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('paused'),
    })
    expect(mocks.findSubscription).not.toHaveBeenCalled()
  })

  it('keeps checkout closed when either scan-worker release gate is absent', async () => {
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'false')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')

    await expect(createCheckoutAction('BETA')).resolves.toEqual({
      ok: false,
      message: 'Subscription checkout is paused. No charge was made.',
    })
    expect(mocks.buildBillingViewModel).not.toHaveBeenCalled()
    expect(mocks.createStripeSession).not.toHaveBeenCalled()
  })

  it('blocks checkout when the view model cannot verify a healthy worker heartbeat', async () => {
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    mocks.buildBillingViewModel.mockResolvedValue({
      status: 'free',
      availability: {
        checkout: {
          state: 'unavailable',
          label: 'Checkout paused for worker readiness',
        },
      },
    })

    await expect(createCheckoutAction('BETA')).resolves.toEqual({
      ok: false,
      message: 'Checkout paused for worker readiness. No charge was made.',
    })
    expect(mocks.findSubscription).not.toHaveBeenCalled()
    expect(mocks.createStripeSession).not.toHaveBeenCalled()
  })

  it('checks live Stripe subscriptions when the local snapshot is stale', async () => {
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_checkout')
    vi.stubEnv('STRIPE_PRICE_BETA', 'price_beta')
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
    mocks.findSubscription.mockResolvedValue({
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: null,
      status: 'inactive',
    })
    mocks.listStripeSubscriptions.mockResolvedValue({ data: [{ status: 'active' }] })

    await expect(createCheckoutAction('BETA')).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('Stripe already has'),
    })
    expect(mocks.findIntent).not.toHaveBeenCalled()
    expect(mocks.createStripeSession).not.toHaveBeenCalled()
  })

  it('retains the same pending intent after a post-session DB write failure and retries safely', async () => {
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_checkout')
    vi.stubEnv('STRIPE_PRICE_BETA', 'price_beta')
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
    const pendingIntent = {
      id: 'intent_1',
      userId: 'user_1',
      kind: 'SUBSCRIPTION',
      sku: 'BETA',
      activeKey: 'SUBSCRIPTION:user_1:BETA',
      stripeCheckoutSessionId: null,
      stripeCheckoutUrl: null,
    }
    mocks.findSubscription.mockResolvedValue({
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: null,
      status: 'inactive',
    })
    mocks.findIntent.mockResolvedValue(pendingIntent)
    mocks.createStripeSession.mockResolvedValue({
      id: 'cs_same',
      url: 'https://checkout.stripe.test/cs_same',
    })
    mocks.updateIntent
      .mockRejectedValueOnce(new Error('database write failed after Stripe responded'))
      .mockResolvedValueOnce({})

    await expect(createCheckoutAction('BETA')).resolves.toMatchObject({ ok: false })
    await expect(createCheckoutAction('BETA')).resolves.toEqual({
      ok: true,
      url: 'https://checkout.stripe.test/cs_same',
    })

    expect(mocks.findIntent).toHaveBeenCalledTimes(2)
    expect(mocks.createStripeSession).toHaveBeenCalledTimes(2)
    expect(mocks.createStripeSession.mock.calls[0][1]).toEqual({ idempotencyKey: 'checkout:intent_1' })
    expect(mocks.createStripeSession.mock.calls[1][1]).toEqual({ idempotencyKey: 'checkout:intent_1' })
    expect(mocks.updateIntent).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', activeKey: null }),
    }))
  })

  it('compensates a newly created Stripe customer when the local transaction fails', async () => {
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_checkout')
    vi.stubEnv('STRIPE_PRICE_BETA', 'price_beta')
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
    mocks.findIntent.mockResolvedValue({
      id: 'intent_1',
      stripeCheckoutSessionId: null,
      stripeCheckoutUrl: null,
    })
    mocks.createStripeSession.mockRejectedValue(new Error('provider unavailable'))

    await expect(createCheckoutAction('BETA')).resolves.toMatchObject({ ok: false })
    expect(mocks.deleteStripeCustomer).toHaveBeenCalledWith('cus_1')
  })

  it('expires a newly created Checkout Session when its DB link cannot commit', async () => {
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_checkout')
    vi.stubEnv('STRIPE_PRICE_BETA', 'price_beta')
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
    mocks.findSubscription.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      stripeSubscriptionId: null,
      status: 'inactive',
    })
    mocks.findIntent.mockResolvedValue({
      id: 'intent_1',
      stripeCheckoutSessionId: null,
      stripeCheckoutUrl: null,
    })
    mocks.createStripeSession.mockResolvedValue({ id: 'cs_unlinked', url: 'https://checkout.test/cs_unlinked' })
    mocks.updateIntent.mockRejectedValue(new Error('database unavailable'))

    await expect(createCheckoutAction('BETA')).resolves.toMatchObject({ ok: false })
    expect(mocks.expireStripeSession).toHaveBeenCalledWith('cs_unlinked')
    expect(mocks.deleteStripeCustomer).not.toHaveBeenCalled()
  })

  it('keeps potion checkout default-off even for a valid catalog item', async () => {
    vi.stubEnv('POTION_CHECKOUT_ENABLED', 'false')
    await expect(createManaCheckoutAction('minor_vial')).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('temporarily unavailable'),
    })
  })

  it('requires HTTPS for the production public URL but permits localhost HTTP in development', () => {
    vi.stubEnv('NEXTAUTH_URL', 'http://example.com')
    vi.stubEnv('NODE_ENV', 'production')
    expect(BILLING_TESTING.getSiteUrl()).toBeNull()

    vi.stubEnv('NEXTAUTH_URL', 'https://example.com/some/path')
    expect(BILLING_TESTING.getSiteUrl()).toBe('https://example.com')

    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
    expect(BILLING_TESTING.getSiteUrl()).toBe('http://localhost:3000')
  })

  it('keeps a completed Checkout in verification and never clears it to create a second charge', async () => {
    const retrieve = vi.fn().mockResolvedValue({
      status: 'complete',
      expires_at: Math.floor(Date.now() / 1000) - 1,
    })
    const stripe = { checkout: { sessions: { retrieve } } } as unknown as Stripe
    await expect(BILLING_TESTING.reusableCheckoutUrl(stripe, {
      id: 'intent_1',
      stripeCheckoutSessionId: 'cs_complete',
      stripeCheckoutUrl: 'https://checkout.stripe.test/cs_complete',
    })).resolves.toEqual({ state: 'verifying' })
    expect(mocks.updateIntent).not.toHaveBeenCalled()
  })

  it('reuses an open Checkout URL instead of creating a parallel pending session', async () => {
    const retrieve = vi.fn().mockResolvedValue({
      status: 'open',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    })
    const stripe = { checkout: { sessions: { retrieve } } } as unknown as Stripe
    await expect(BILLING_TESTING.reusableCheckoutUrl(stripe, {
      id: 'intent_1',
      stripeCheckoutSessionId: 'cs_open',
      stripeCheckoutUrl: 'https://checkout.stripe.test/cs_open',
    })).resolves.toEqual({ state: 'reuse', url: 'https://checkout.stripe.test/cs_open' })
    expect(mocks.updateIntent).not.toHaveBeenCalled()
  })

  it('expires a dead pending Checkout before allowing a fresh persisted intent', async () => {
    const retrieve = vi.fn().mockResolvedValue({
      status: 'expired',
      expires_at: Math.floor(Date.now() / 1000) - 1,
    })
    const stripe = { checkout: { sessions: { retrieve } } } as unknown as Stripe
    await expect(BILLING_TESTING.reusableCheckoutUrl(stripe, {
      id: 'intent_1',
      stripeCheckoutSessionId: 'cs_expired',
      stripeCheckoutUrl: 'https://checkout.stripe.test/cs_expired',
    })).resolves.toEqual({ state: 'replace' })
    expect(mocks.updateIntent).toHaveBeenCalledWith({
      where: { id: 'intent_1' },
      data: { status: 'EXPIRED', activeKey: null, stripeCheckoutUrl: null },
    })
  })
})
