import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'

const mocks = vi.hoisted(() => ({
  stripeConstructor: vi.fn(),
  requireCurrentUser: vi.fn(),
  findSubscription: vi.fn(),
  // Stripe surface
  customersCreate: vi.fn(),
  customersDel: vi.fn(),
  subscriptionsList: vi.fn(),
  sessionsCreate: vi.fn(),
  sessionsRetrieve: vi.fn(),
  sessionsExpire: vi.fn(),
  // Transaction client surface
  txSubscriptionFindUnique: vi.fn(),
  txSubscriptionUpsert: vi.fn(),
  txIntentFindUnique: vi.fn(),
  txIntentFindUniqueOrThrow: vi.fn(),
  txIntentCreate: vi.fn(),
  txIntentUpdate: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('stripe', () => ({
  default: class StripeMock {
    customers = { create: mocks.customersCreate, del: mocks.customersDel }
    subscriptions = { list: mocks.subscriptionsList }
    checkout = {
      sessions: {
        create: mocks.sessionsCreate,
        retrieve: mocks.sessionsRetrieve,
        expire: mocks.sessionsExpire,
      },
    }

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
// The deletion barrier owns the advisory lock and transaction. Replacing it with a
// direct invocation keeps these cases focused on checkout replay-safety; the barrier's
// own locking is covered by DeletionBillingBarrier's tests.
vi.mock('@/src/modules/lifecycle/application/DeletionBillingBarrier', () => ({
  deletionBlocksBilling: (state: { request?: unknown; audit?: unknown }) =>
    Boolean(state.request || state.audit),
  withUserDeletionLock: (
    _userId: string,
    work: (tx: unknown, state: unknown) => Promise<unknown>,
  ) =>
    work(
      {
        billingSubscription: {
          findUnique: mocks.txSubscriptionFindUnique,
          upsert: mocks.txSubscriptionUpsert,
        },
        checkoutIntent: {
          findUnique: mocks.txIntentFindUnique,
          findUniqueOrThrow: mocks.txIntentFindUniqueOrThrow,
          create: mocks.txIntentCreate,
          update: mocks.txIntentUpdate,
        },
      },
      { request: null, audit: null },
    ),
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

describe('BillingService checkout replay safety', () => {
  const ACTIVE_KEY = 'SUBSCRIPTION:user_1:BETA'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ENABLE_BETA_CHECKOUT', 'true')
    vi.stubEnv('SUBSCRIPTION_CHECKOUT_ENABLED', 'true')
    vi.stubEnv('ENABLE_SCAN_WORKER', 'true')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('STRIPE_PRICE_BETA', 'price_beta')
    vi.stubEnv('NEXTAUTH_URL', 'https://app.example.com')
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_replay_safety')

    mocks.requireCurrentUser.mockResolvedValue({ id: 'user_1', email: 'hunter@example.com' })
    mocks.findSubscription.mockResolvedValue(null)
    mocks.txSubscriptionFindUnique.mockResolvedValue({
      userId: 'user_1',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: null,
      status: 'inactive',
    })
    mocks.subscriptionsList.mockResolvedValue({ data: [] })
    mocks.txIntentUpdate.mockResolvedValue({})
  })

  afterEach(() => vi.unstubAllEnvs())

  it('persists the intent key before creating the Stripe Checkout Session', async () => {
    const order: string[] = []
    mocks.txIntentFindUnique.mockResolvedValue(null)
    mocks.txIntentCreate.mockImplementation(async () => {
      order.push('persist-intent')
      return { id: 'intent_1', stripeCheckoutSessionId: null, stripeCheckoutUrl: null }
    })
    mocks.sessionsCreate.mockImplementation(async () => {
      order.push('stripe-session')
      return { id: 'cs_1', url: 'https://checkout.stripe.com/cs_1' }
    })

    const result = await BillingService.createCheckout('BETA')

    expect(result).toEqual({ ok: true, url: 'https://checkout.stripe.com/cs_1' })
    // The side effect must never precede the key that makes it replayable.
    expect(order).toEqual(['persist-intent', 'stripe-session'])
    expect(mocks.txIntentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ activeKey: ACTIVE_KEY }) }),
    )
  })

  it('keys the Stripe Session on the persisted intent so a provider retry cannot double-charge', async () => {
    mocks.txIntentFindUnique.mockResolvedValue(null)
    mocks.txIntentCreate.mockResolvedValue({
      id: 'intent_1',
      stripeCheckoutSessionId: null,
      stripeCheckoutUrl: null,
    })
    mocks.sessionsCreate.mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/cs_1' })

    await BillingService.createCheckout('BETA')

    expect(mocks.sessionsCreate).toHaveBeenCalledWith(
      expect.anything(),
      { idempotencyKey: 'checkout:intent_1' },
    )
  })

  it('returns the original Checkout URL on a repeat request without creating a second Session', async () => {
    mocks.txIntentFindUnique.mockResolvedValue({
      id: 'intent_1',
      stripeCheckoutSessionId: 'cs_1',
      stripeCheckoutUrl: 'https://checkout.stripe.com/cs_1',
    })
    mocks.sessionsRetrieve.mockResolvedValue({ status: 'open' })

    const result = await BillingService.createCheckout('BETA')

    expect(result).toEqual({ ok: true, url: 'https://checkout.stripe.com/cs_1' })
    expect(mocks.sessionsCreate).not.toHaveBeenCalled()
    expect(mocks.txIntentCreate).not.toHaveBeenCalled()
  })

  it('refuses to start a new charge while a completed Session is still being verified', async () => {
    mocks.txIntentFindUnique.mockResolvedValue({
      id: 'intent_1',
      stripeCheckoutSessionId: 'cs_1',
      stripeCheckoutUrl: 'https://checkout.stripe.com/cs_1',
    })
    mocks.sessionsRetrieve.mockResolvedValue({ status: 'complete' })

    await expect(BillingService.createCheckout('BETA')).resolves.toEqual({
      ok: false,
      message: 'Your completed Checkout is being verified. No new charge was started.',
    })
    expect(mocks.sessionsCreate).not.toHaveBeenCalled()
  })

  it('resolves a concurrent duplicate through the unique constraint instead of a second intent', async () => {
    // Both callers pass the existence check, then the database rejects the loser.
    mocks.txIntentFindUnique.mockResolvedValue(null)
    mocks.txIntentCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    )
    mocks.txIntentFindUniqueOrThrow.mockResolvedValue({
      id: 'intent_winner',
      stripeCheckoutSessionId: null,
      stripeCheckoutUrl: null,
    })
    mocks.sessionsCreate.mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/cs_1' })

    const result = await BillingService.createCheckout('BETA')

    expect(result).toEqual({ ok: true, url: 'https://checkout.stripe.com/cs_1' })
    expect(mocks.txIntentFindUniqueOrThrow).toHaveBeenCalledWith({ where: { activeKey: ACTIVE_KEY } })
    // The loser adopts the winner's intent, so both requests key Stripe identically.
    expect(mocks.sessionsCreate).toHaveBeenCalledWith(
      expect.anything(),
      { idempotencyKey: 'checkout:intent_winner' },
    )
  })

  it('does not surface a non-conflict database failure as a successful checkout', async () => {
    mocks.txIntentFindUnique.mockResolvedValue(null)
    mocks.txIntentCreate.mockRejectedValue(new Error('connection reset'))

    await expect(BillingService.createCheckout('BETA')).resolves.toEqual({
      ok: false,
      message: 'Checkout could not be started. No charge was made.',
    })
    expect(mocks.sessionsCreate).not.toHaveBeenCalled()
  })
})
