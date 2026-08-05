import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  entitlementsForUser: vi.fn(),
  findSubscription: vi.fn(),
  findHeartbeat: vi.fn(),
  countKeywords: vi.fn(),
  findCheckoutIntent: vi.fn(),
  countSubscriptions: vi.fn(),
  countCheckoutIntents: vi.fn(),
  assertStripeMode: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/src/modules/billing/application/EntitlementService', () => ({
  EntitlementService: { forUser: mocks.entitlementsForUser },
}))
vi.mock('@/src/modules/billing/infrastructure/stripeEnvironment', () => ({
  assertStripeSecretKeyMatchesExpectedMode: mocks.assertStripeMode,
}))
vi.mock('@/lib/prisma', () => ({
  default: {
    billingSubscription: { findUnique: mocks.findSubscription, count: mocks.countSubscriptions },
    operationalHeartbeat: { findUnique: mocks.findHeartbeat },
    trackedKeyword: { count: mocks.countKeywords },
    checkoutIntent: { findFirst: mocks.findCheckoutIntent, count: mocks.countCheckoutIntents },
  },
}))

import {
  BILLING_LOADING_VIEW_MODEL,
  buildBillingViewModel,
} from './viewModel'

const NOW = new Date('2026-08-01T12:00:00.000Z')

function enableReadyCheckoutAndWorker() {
  vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
  vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
  vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
  vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
  vi.stubEnv('CRON_SECRET', 'cron-secret-with-at-least-thirty-two-characters')
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_mocked')
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_mocked')
  vi.stubEnv('STRIPE_PRICE_BETA', 'price_beta')
  vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
  vi.stubEnv('STRIPE_LIVEMODE', 'false')
  mocks.findHeartbeat.mockResolvedValue({
    lastSucceededAt: new Date('2026-08-01T11:59:00.000Z'),
    lastErrorCode: null,
  })
}

describe('server-owned billing view model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.countSubscriptions.mockResolvedValue(0)
    mocks.countCheckoutIntents.mockResolvedValue(0)
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'false')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'false')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'false')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'false')
    vi.stubEnv('STRIPE_SECRET_KEY', '')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '')
    vi.stubEnv('STRIPE_PRICE_BETA', '')
    vi.stubEnv('NEXTAUTH_URL', '')
    mocks.requireCurrentUser.mockResolvedValue({
      id: 'user_1',
      questsRemaining: 0,
      maxCredits: 0,
    })
    mocks.entitlementsForUser.mockResolvedValue({
      plan: 'FREE',
      planName: 'Free Scout',
      subscriptionStatus: 'inactive',
      paid: false,
      scanLimit: 0,
    })
    mocks.findSubscription.mockResolvedValue(null)
    mocks.findHeartbeat.mockResolvedValue(null)
    mocks.countKeywords.mockResolvedValue(0)
    mocks.findCheckoutIntent.mockResolvedValue(null)
  })

  afterEach(() => vi.unstubAllEnvs())

  it('defines a neutral loading model without a believable free placeholder', () => {
    expect(BILLING_LOADING_VIEW_MODEL).toEqual(expect.objectContaining({
      status: 'loading',
      message: expect.stringContaining('No plan, balance, or paid access'),
    }))
  })

  it('fails closed when account or database verification is unavailable', async () => {
    mocks.requireCurrentUser.mockRejectedValue(new Error('database unavailable'))

    await expect(buildBillingViewModel({ now: NOW })).resolves.toEqual(expect.objectContaining({
      status: 'unavailable',
      message: expect.stringContaining('No plan, balance, paid access'),
    }))
  })

  it('renders a free account with checkout and worker default-off', async () => {
    const model = await buildBillingViewModel({ now: NOW })

    expect(model).toMatchObject({
      status: 'free',
      subscription: { plan: 'FREE', paid: false },
      credits: { balance: 0, estimatedScanCost: 1, estimatedBalanceAfterScan: 0 },
      scan: { eligible: false },
      availability: {
        checkout: { state: 'disabled' },
        worker: { state: 'disabled' },
        creditTopUps: { state: 'disabled' },
      },
    })
  })

  it('shows paid renewal, credit economics, and scan eligibility only with a healthy worker', async () => {
    enableReadyCheckoutAndWorker()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'user_1', questsRemaining: 12, maxCredits: 50 })
    mocks.entitlementsForUser.mockResolvedValue({
      plan: 'BETA',
      planName: 'Beta Hunter',
      subscriptionStatus: 'active',
      paid: true,
      scanLimit: 50,
    })
    mocks.findSubscription.mockResolvedValue({
      plan: 'BETA',
      status: 'active',
      currentPeriodEnd: new Date('2026-08-20T00:00:00.000Z'),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_1',
    })
    mocks.countKeywords.mockResolvedValue(2)

    const model = await buildBillingViewModel({ now: NOW })

    expect(model).toMatchObject({
      status: 'paid',
      subscription: {
        plan: 'BETA',
        statusLabel: 'Paid access verified',
        renewalLabel: 'Renews on Aug 20, 2026 unless cancelled in Stripe.',
      },
      credits: { balance: 12, estimatedBalanceAfterScan: 11 },
      scan: { eligible: true, activeKeywordCount: 2 },
      availability: {
        payment: { state: 'available' },
        checkout: { state: 'available' },
        worker: { state: 'available' },
        portal: { state: 'available' },
      },
    })
  })

  it.each([
    ['past_due', 'past_due', 'Payment past due'],
    ['canceled', 'cancelled', 'Subscription cancelled'],
  ])('maps provider status %s to explicit %s truth', async (providerStatus, expectedStatus, label) => {
    mocks.entitlementsForUser.mockResolvedValue({
      plan: 'FREE',
      planName: 'Free Scout',
      subscriptionStatus: providerStatus,
      paid: false,
      scanLimit: 0,
    })
    mocks.findSubscription.mockResolvedValue({
      plan: 'BETA',
      status: providerStatus,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_1',
    })

    await expect(buildBillingViewModel({ now: NOW })).resolves.toMatchObject({
      status: expectedStatus,
      subscription: { statusLabel: label },
    })
  })

  it('marks mismatched launch switches as misconfigured and keeps checkout closed', async () => {
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'false')

    await expect(buildBillingViewModel({ now: NOW })).resolves.toMatchObject({
      status: 'misconfigured',
      availability: { checkout: { state: 'misconfigured', label: 'Checkout gate mismatch' } },
    })
  })

  it('blocks checkout when payment is configured but worker readiness is stale', async () => {
    enableReadyCheckoutAndWorker()
    mocks.findHeartbeat.mockResolvedValue({
      lastSucceededAt: new Date('2026-08-01T11:50:00.000Z'),
      lastErrorCode: null,
    })

    await expect(buildBillingViewModel({ now: NOW })).resolves.toMatchObject({
      availability: {
        worker: { state: 'unavailable', label: 'Worker heartbeat stale' },
        checkout: { state: 'unavailable', label: 'Checkout paused for worker readiness' },
      },
    })
  })

  it('keeps a Stripe return pending until a completed local intent and paid entitlement agree', async () => {
    mocks.findCheckoutIntent
      .mockResolvedValueOnce({ status: 'PENDING', kind: 'SUBSCRIPTION' })
      .mockResolvedValueOnce({ status: 'PENDING', kind: 'SUBSCRIPTION' })

    await expect(buildBillingViewModel({
      checkout: 'verifying',
      sessionId: 'cs_test_pending_1',
      now: NOW,
    })).resolves.toMatchObject({
      checkoutReturn: {
        state: 'pending',
        title: 'Checkout returned — verification pending',
      },
    })
  })

  it('shows verified activation only after webhook-backed entitlement and intent completion', async () => {
    enableReadyCheckoutAndWorker()
    mocks.entitlementsForUser.mockResolvedValue({
      plan: 'BETA',
      planName: 'Beta Hunter',
      subscriptionStatus: 'active',
      paid: true,
      scanLimit: 50,
    })
    mocks.findSubscription.mockResolvedValue({
      plan: 'BETA',
      status: 'active',
      currentPeriodEnd: new Date('2026-08-20T00:00:00.000Z'),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_1',
    })
    mocks.findCheckoutIntent
      .mockResolvedValueOnce({ status: 'COMPLETED', kind: 'SUBSCRIPTION' })
      .mockResolvedValueOnce({ status: 'COMPLETED', kind: 'SUBSCRIPTION' })

    await expect(buildBillingViewModel({
      checkout: 'verifying',
      sessionId: 'cs_test_completed_1',
      now: NOW,
    })).resolves.toMatchObject({
      checkoutReturn: { state: 'verified', title: 'Paid access verified' },
    })
  })

  it('recovers a recent pending intent when the legacy proxy drops return query parameters', async () => {
    mocks.findCheckoutIntent.mockResolvedValue({ status: 'PENDING', kind: 'SUBSCRIPTION' })

    await expect(buildBillingViewModel({ now: NOW })).resolves.toMatchObject({
      checkoutReturn: { state: 'pending' },
    })
  })

  it('renders an explicit cancelled Checkout return without granting access', async () => {
    await expect(buildBillingViewModel({ checkout: 'cancelled', now: NOW })).resolves.toMatchObject({
      checkoutReturn: {
        state: 'cancelled',
        message: expect.stringContaining('No success is being claimed'),
      },
    })
  })

  it('offers the Founder Pass only when seats, price, and checkout are all ready', async () => {
    enableReadyCheckoutAndWorker()
    vi.stubEnv('STRIPE_PRICE_FOUNDER', 'price_founder')
    mocks.countSubscriptions.mockResolvedValue(30)
    mocks.countCheckoutIntents.mockResolvedValue(4)

    await expect(buildBillingViewModel({ now: NOW })).resolves.toMatchObject({
      founderPass: {
        limit: 50,
        claimed: 30,
        reserved: 4,
        remaining: 16,
        soldOut: false,
        priceConfigured: true,
        sellable: true,
      },
    })
  })

  it('stops offering the Founder Pass once every seat is taken', async () => {
    enableReadyCheckoutAndWorker()
    vi.stubEnv('STRIPE_PRICE_FOUNDER', 'price_founder')
    mocks.countSubscriptions.mockResolvedValue(50)

    await expect(buildBillingViewModel({ now: NOW })).resolves.toMatchObject({
      founderPass: { remaining: 0, soldOut: true, sellable: false },
    })
  })

  it('does not offer the Founder Pass while its Stripe price is unconfigured', async () => {
    enableReadyCheckoutAndWorker()
    vi.stubEnv('STRIPE_PRICE_FOUNDER', '')

    await expect(buildBillingViewModel({ now: NOW })).resolves.toMatchObject({
      founderPass: { soldOut: false, priceConfigured: false, sellable: false },
    })
  })
})
