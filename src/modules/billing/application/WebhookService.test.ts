import { Prisma } from '@prisma/client'
import type Stripe from 'stripe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  webhookCreate: vi.fn(),
  webhookUpdateMany: vi.fn(),
  webhookFind: vi.fn(),
  billingFindUnique: vi.fn(),
  userFind: vi.fn(),
  checkoutFind: vi.fn(),
  checkoutUpdateMany: vi.fn(),
  transaction: vi.fn(),
  txBillingFind: vi.fn(),
  txBillingUpsert: vi.fn(),
  txCheckoutUpdate: vi.fn(),
  txCreditCreate: vi.fn(),
  txCreditFind: vi.fn(),
  txUserUpdate: vi.fn(),
  deletionRequestFind: vi.fn(),
  deletionRequestUpdateMany: vi.fn(),
  grantInvoice: vi.fn(),
  deletionAuditFind: vi.fn(),
  withUserDeletionLock: vi.fn(),
  withDeletionSubjectLock: vi.fn(),
  userDeletionState: { subjectDigest: 'user_digest', request: null, audit: null } as {
    subjectDigest: string
    request: null | { id: string; status: string; stripeCustomerId: string | null; stripeSubscriptionId: string | null }
    audit: null | { id: string }
  },
  digestDeletionState: { subjectDigest: 'customer_digest', request: null, audit: null } as {
    subjectDigest: string
    request: null | { id: string; status: string; stripeCustomerId: string | null; stripeSubscriptionId: string | null }
    audit: null | { id: string }
  },
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    stripeWebhookEvent: {
      create: mocks.webhookCreate,
      updateMany: mocks.webhookUpdateMany,
      findUniqueOrThrow: mocks.webhookFind,
    },
    billingSubscription: { findUnique: mocks.billingFindUnique },
    user: { findUnique: mocks.userFind },
    checkoutIntent: { findUnique: mocks.checkoutFind, updateMany: mocks.checkoutUpdateMany },
    accountDeletionRequest: { findFirst: mocks.deletionRequestFind },
    accountDeletionAudit: { findUnique: mocks.deletionAuditFind },
    $transaction: mocks.transaction,
  },
}))
vi.mock('@/src/modules/lifecycle/application/DeletionBillingBarrier', () => ({
  deletionBlocksBilling: (state: { request: unknown; audit: unknown }) => Boolean(state.request || state.audit),
  withUserDeletionLock: mocks.withUserDeletionLock,
  withDeletionSubjectLock: mocks.withDeletionSubjectLock,
}))
vi.mock('./CreditService', () => ({
  CreditService: { grantInvoiceAllocation: mocks.grantInvoice },
}))

import {
  BILLING_WEBHOOK_TESTING,
  RetryableBillingError,
  WebhookService,
} from './WebhookService'

const duplicateError = () => new Prisma.PrismaClientKnownRequestError('duplicate', {
  code: 'P2002',
  clientVersion: Prisma.prismaVersion.client,
})

function event(type = 'checkout.session.expired') {
  return {
    id: 'evt_1',
    type,
    livemode: false,
    created: 1785369600,
    data: { object: { id: 'cs_1' } },
  } as Stripe.Event
}

function subscription(overrides: Partial<Stripe.Subscription> = {}) {
  return {
    id: 'sub_1',
    customer: 'cus_1',
    metadata: { userId: 'user_1' },
    status: 'active',
    cancel_at_period_end: false,
    items: {
      data: [{ price: { id: 'price_beta' }, current_period_end: 1787961600 }],
    },
    ...overrides,
  } as Stripe.Subscription
}

function stripeWithSubscription(value: Stripe.Subscription) {
  return {
    subscriptions: { retrieve: vi.fn().mockResolvedValue(value) },
  } as unknown as Stripe
}

describe('Stripe webhook inbox and reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_PRICE_BETA', 'price_beta')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_webhook')
    vi.stubEnv('DELETION_AUDIT_SECRET', 'test-deletion-audit-secret')
    const tx = {
      billingSubscription: {
        findUnique: mocks.txBillingFind,
        upsert: mocks.txBillingUpsert,
      },
      checkoutIntent: { update: mocks.txCheckoutUpdate, updateMany: mocks.checkoutUpdateMany },
      creditLedgerEntry: { create: mocks.txCreditCreate, findUnique: mocks.txCreditFind },
      user: { update: mocks.txUserUpdate },
      accountDeletionRequest: { updateMany: mocks.deletionRequestUpdateMany },
    }
    mocks.transaction.mockImplementation(async (fn) => fn(tx))
    mocks.userDeletionState = { subjectDigest: 'user_digest', request: null, audit: null }
    mocks.digestDeletionState = { subjectDigest: 'customer_digest', request: null, audit: null }
    mocks.withUserDeletionLock.mockImplementation(async (_userId, callback) => callback(tx, mocks.userDeletionState))
    mocks.withDeletionSubjectLock.mockImplementation(async (_digest, callback) => callback(tx, mocks.digestDeletionState))
    mocks.billingFindUnique.mockResolvedValue(null)
    mocks.userFind.mockResolvedValue({ id: 'user_1' })
    mocks.checkoutFind.mockResolvedValue({ id: 'intent_1', userId: 'user_1' })
    mocks.txBillingFind.mockResolvedValue(null)
    mocks.txBillingUpsert.mockResolvedValue({})
    mocks.grantInvoice.mockResolvedValue({ granted: true })
    mocks.deletionRequestFind.mockResolvedValue(null)
    mocks.deletionRequestUpdateMany.mockResolvedValue({ count: 1 })
    mocks.deletionAuditFind.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('treats only a PROCESSED inbox row as an accepted duplicate', async () => {
    mocks.webhookCreate.mockRejectedValue(duplicateError())
    mocks.webhookUpdateMany.mockResolvedValue({ count: 0 })
    mocks.webhookFind.mockResolvedValue({ status: 'PROCESSED' })
    await expect(BILLING_WEBHOOK_TESTING.acquireWebhookEvent(event())).resolves.toEqual({
      state: 'processed',
    })
  })

  it('keeps a non-expired PROCESSING inbox row retryable', async () => {
    mocks.webhookCreate.mockRejectedValue(duplicateError())
    mocks.webhookUpdateMany.mockResolvedValue({ count: 0 })
    mocks.webhookFind.mockResolvedValue({ status: 'PROCESSING' })
    await expect(BILLING_WEBHOOK_TESTING.acquireWebhookEvent(event())).resolves.toEqual({
      state: 'in_progress',
    })
  })

  it('reports active processing separately from a terminal duplicate', async () => {
    mocks.webhookCreate.mockRejectedValue(duplicateError())
    mocks.webhookUpdateMany.mockResolvedValue({ count: 0 })
    mocks.webhookFind.mockResolvedValueOnce({ status: 'PROCESSING' })
    await expect(WebhookService.process({} as Stripe, event())).resolves.toEqual({
      recognized: true,
      duplicate: false,
      inProgress: true,
    })

    mocks.webhookFind.mockResolvedValueOnce({ status: 'PROCESSED' })
    await expect(WebhookService.process({} as Stripe, event())).resolves.toEqual({
      recognized: true,
      duplicate: true,
      inProgress: false,
    })
  })

  it('reclaims a FAILED event and increments its fenced attempt', async () => {
    mocks.webhookCreate.mockRejectedValue(duplicateError())
    mocks.webhookUpdateMany.mockResolvedValue({ count: 1 })
    mocks.webhookFind.mockResolvedValue({ attempts: 2 })
    await expect(BILLING_WEBHOOK_TESTING.acquireWebhookEvent(event())).resolves.toEqual({
      state: 'acquired',
      attempt: 2,
    })
    expect(mocks.webhookUpdateMany.mock.calls[0][0].where.OR).toContainEqual({ status: 'FAILED' })
  })

  it('reclaims only a stale PROCESSING lease and refreshes the attempt timestamp', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-30T12:00:00.000Z'))
    mocks.webhookCreate.mockRejectedValue(duplicateError())
    mocks.webhookUpdateMany.mockResolvedValue({ count: 1 })
    mocks.webhookFind.mockResolvedValue({ attempts: 3 })

    await BILLING_WEBHOOK_TESTING.acquireWebhookEvent(event())
    const request = mocks.webhookUpdateMany.mock.calls[0][0]
    expect(request.where.OR).toContainEqual({
      status: 'PROCESSING',
      updatedAt: { lt: new Date('2026-07-30T11:50:00.000Z') },
    })
    expect(request.data).toMatchObject({
      status: 'PROCESSING',
      attempts: { increment: 1 },
      updatedAt: new Date('2026-07-30T12:00:00.000Z'),
    })
  })

  it('fails retryably when a stale worker loses its fenced completion update', async () => {
    mocks.webhookUpdateMany.mockResolvedValue({ count: 0 })
    await expect(BILLING_WEBHOOK_TESTING.markWebhookProcessed('evt_stale', 1))
      .rejects.toThrow(RetryableBillingError)
  })

  it('never reports service success after losing the completion fence', async () => {
    mocks.webhookCreate.mockResolvedValue({ attempts: 1 })
    mocks.checkoutUpdateMany.mockResolvedValue({ count: 1 })
    mocks.webhookUpdateMany.mockResolvedValue({ count: 0 })

    await expect(WebhookService.process({} as Stripe, event()))
      .rejects.toThrow('lease was lost')
    expect(mocks.webhookUpdateMany).toHaveBeenCalledTimes(2)
  })

  it('terminally accepts a late Stripe event for a purged customer', async () => {
    mocks.webhookCreate.mockResolvedValue({ attempts: 1 })
    mocks.webhookUpdateMany.mockResolvedValue({ count: 1 })
    mocks.deletionAuditFind.mockResolvedValue({ id: 'audit_1' })
    const deletedSubscription = subscription()

    await expect(WebhookService.process(
      stripeWithSubscription(deletedSubscription),
      {
        ...event('customer.subscription.deleted'),
        data: { object: deletedSubscription },
      } as Stripe.Event,
    )).resolves.toEqual({ recognized: true, duplicate: false, inProgress: false })

    expect(mocks.deletionAuditFind).toHaveBeenCalledWith({
      where: { stripeCustomerDigest: expect.stringMatching(/^[a-f0-9]{64}$/) },
      select: { id: true },
    })
    expect(mocks.txBillingUpsert).not.toHaveBeenCalled()
  })

  it('does not let stale user metadata bypass a customer-linked deletion request', async () => {
    mocks.webhookCreate.mockResolvedValue({ attempts: 1 })
    mocks.webhookUpdateMany.mockResolvedValue({ count: 1 })
    mocks.deletionRequestFind.mockResolvedValue({ subjectDigest: 'actual_subject_digest' })
    mocks.digestDeletionState = {
      subjectDigest: 'actual_subject_digest',
      request: {
        id: 'delete_1',
        status: 'PENDING',
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: null,
      },
      audit: null,
    }
    const staleMetadata = subscription({ metadata: { userId: 'stale_user' } })

    await expect(WebhookService.process(
      stripeWithSubscription(staleMetadata),
      {
        ...event('customer.subscription.updated'),
        data: { object: staleMetadata },
      } as Stripe.Event,
    )).resolves.toEqual({ recognized: true, duplicate: false, inProgress: false })

    expect(mocks.withUserDeletionLock).toHaveBeenCalledWith('stale_user', expect.any(Function))
    expect(mocks.withDeletionSubjectLock).toHaveBeenCalledWith('actual_subject_digest', expect.any(Function))
    expect(mocks.deletionRequestUpdateMany).toHaveBeenCalledWith({
      where: { id: 'delete_1', status: { not: 'COMPLETED' } },
      data: { stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1' },
    })
    expect(mocks.txBillingUpsert).not.toHaveBeenCalled()
  })

  it('stores a stable failure code without raw provider messages or identifiers', async () => {
    mocks.webhookUpdateMany.mockResolvedValue({ count: 1 })
    await BILLING_WEBHOOK_TESTING.markWebhookFailed(
      'evt_1',
      1,
      new Error('Customer cus_secret hunter@example.com failed'),
    )

    expect(mocks.webhookUpdateMany).toHaveBeenCalledWith({
      where: { eventId: 'evt_1', status: 'PROCESSING', attempts: 1 },
      data: { status: 'FAILED', error: 'BILLING_PROCESSING_FAILED' },
    })
  })

  it('keeps an unknown subscription customer retryable instead of granting access', async () => {
    const unlinked = subscription({ metadata: {} })
    await expect(BILLING_WEBHOOK_TESTING.reconcileSubscription({
      stripe: stripeWithSubscription(unlinked),
      subscriptionId: unlinked.id,
      eventCreatedAt: new Date(),
    })).rejects.toThrow(RetryableBillingError)
    expect(mocks.txBillingUpsert).not.toHaveBeenCalled()
    expect(mocks.grantInvoice).not.toHaveBeenCalled()
  })

  it('rejects conflicting subscription-ID and customer-ID ownership', async () => {
    mocks.billingFindUnique
      .mockResolvedValueOnce({ userId: 'user_1' })
      .mockResolvedValueOnce({ userId: 'user_2' })
    await expect(BILLING_WEBHOOK_TESTING.reconcileSubscription({
      stripe: stripeWithSubscription(subscription({ metadata: {} })),
      subscriptionId: 'sub_1',
      eventCreatedAt: new Date(),
    })).rejects.toThrow('links conflict')
    expect(mocks.txBillingUpsert).not.toHaveBeenCalled()
  })

  it('rejects test-mode events when production livemode is required', async () => {
    vi.stubEnv('STRIPE_LIVEMODE', 'true')
    await expect(WebhookService.process(
      stripeWithSubscription(subscription()),
      event('invoice.paid'),
    )).rejects.toThrow('livemode')
    expect(mocks.webhookCreate).not.toHaveBeenCalled()
  })

  it('does not let an older subscription event overwrite a newer snapshot', async () => {
    mocks.txBillingFind.mockResolvedValue({
      latestStripeEventCreatedAt: new Date('2026-07-30T13:00:00.000Z'),
    })
    await BILLING_WEBHOOK_TESTING.reconcileSubscription({
      stripe: stripeWithSubscription(subscription()),
      subscriptionId: 'sub_1',
      eventCreatedAt: new Date('2026-07-30T12:00:00.000Z'),
    })
    expect(mocks.txBillingUpsert).not.toHaveBeenCalled()
  })

  it('dispatches an eligible paid renewal invoice to the economic credit service', async () => {
    const invoice = {
      id: 'in_cycle_1',
      status: 'paid',
      amount_paid: 1499,
      billing_reason: 'subscription_cycle',
      currency: 'usd',
      customer: 'cus_1',
      parent: {
        type: 'subscription_details',
        quote_details: null,
        subscription_details: { subscription: 'sub_1', metadata: {} },
      },
      lines: {
        data: [{
          pricing: {
            type: 'price_details',
            unit_amount_decimal: '1499',
            price_details: { price: 'price_beta', product: 'prod_beta' },
          },
        }],
      },
    } as unknown as Stripe.Invoice

    await BILLING_WEBHOOK_TESTING.processRecognizedEvent(
      stripeWithSubscription(subscription()),
      {
        ...event('invoice.paid'),
        data: { object: invoice },
      } as Stripe.Event,
    )
    expect(mocks.grantInvoice).toHaveBeenCalledWith({
      userId: 'user_1',
      credits: 50,
      sourceType: 'STRIPE_INVOICE',
      sourceId: 'in_cycle_1',
      reason: 'PLAN_PERIOD_ALLOCATION',
    }, expect.anything())
  })
})
