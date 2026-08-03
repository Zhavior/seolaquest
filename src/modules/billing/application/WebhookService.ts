import 'server-only'

import { Prisma } from '@prisma/client'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { CreditService } from '@/src/modules/billing/application/CreditService'
import { PLAN_CATALOG, isPlanCode } from '@/src/modules/billing/domain/catalog'
import {
  subscriptionIdFromInvoice,
  validatePaidPlanInvoice,
  validatePotionCheckout,
} from '@/src/modules/billing/domain/webhookValidation'
import { planCodeForStripePrice, stripePriceIdForPlan } from '@/src/modules/billing/infrastructure/stripeCatalog'
import {
  assertStripeSecretKeyMatchesExpectedMode,
  expectedStripeLivemode,
} from '@/src/modules/billing/infrastructure/stripeEnvironment'
import {
  stripeCustomerDigestForId,
} from '@/src/modules/lifecycle/domain/accountDeletion'
import {
  deletionBlocksBilling,
  type DeletionSubjectState,
  type DeletionSubjectTransaction,
  withDeletionSubjectLock,
  withUserDeletionLock,
} from '@/src/modules/lifecycle/application/DeletionBillingBarrier'

const RECOGNIZED_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.expired',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
])

const PROCESSING_LEASE_MS = 10 * 60 * 1000

export class RetryableBillingError extends Error {}

type DeletionReferences = {
  userId?: string | null
  customerId?: string | null
  subscriptionId?: string | null
}

function validateStripeRuntimeMode() {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!stripeKey) throw new RetryableBillingError('STRIPE_SECRET_KEY is not configured')
  try {
    return assertStripeSecretKeyMatchesExpectedMode(stripeKey)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe mode configuration is invalid'
    throw new RetryableBillingError(message)
  }
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function stripeId(value: string | { id: string } | null) {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

function deletionReferencesFromEvent(event: Stripe.Event): DeletionReferences {
  const object = event.data.object as Stripe.Event.Data.Object & {
    id: string
    client_reference_id?: string | null
    customer?: string | { id: string } | null
    metadata?: Record<string, string> | null
    subscription?: string | { id: string } | null
  }
  return {
    userId: object.metadata?.userId ?? object.client_reference_id ?? null,
    customerId: stripeId(object.customer ?? null),
    subscriptionId: event.type.startsWith('customer.subscription.')
      ? object.id
      : stripeId(object.subscription ?? null),
  }
}

async function bindLateBillingReferences(
  tx: DeletionSubjectTransaction,
  state: DeletionSubjectState,
  references: DeletionReferences,
) {
  if (!state.request || state.request.status === 'COMPLETED') return
  if (
    references.customerId &&
    state.request.stripeCustomerId &&
    state.request.stripeCustomerId !== references.customerId
  ) {
    throw new RetryableBillingError('Deletion request customer linkage conflict')
  }
  if (
    references.subscriptionId &&
    state.request.stripeSubscriptionId &&
    state.request.stripeSubscriptionId !== references.subscriptionId
  ) {
    throw new RetryableBillingError('Deletion request subscription linkage conflict')
  }

  const data = {
    ...(references.customerId ? { stripeCustomerId: references.customerId } : {}),
    ...(references.subscriptionId ? { stripeSubscriptionId: references.subscriptionId } : {}),
  }
  if (Object.keys(data).length === 0) return

  await tx.accountDeletionRequest.updateMany({
    where: { id: state.request.id, status: { not: 'COMPLETED' } },
    data,
  })
}

async function interceptDeletedAccount(references: DeletionReferences) {
  // The audit key is a deployment gate for deletion. Once enabled, all billing
  // mutations use the same keyed subject lock as lifecycle intake.
  if (!process.env.DELETION_AUDIT_SECRET?.trim()) return false

  if (references.userId) {
    const blockedBySubject = await withUserDeletionLock(references.userId, async (tx, state) => {
      if (!deletionBlocksBilling(state)) return false
      await bindLateBillingReferences(tx, state, references)
      return true
    })
    if (blockedBySubject) return true
  }

  if (!references.customerId) return false
  const request = await prisma.accountDeletionRequest.findFirst({
    where: { stripeCustomerId: references.customerId },
    select: { subjectDigest: true },
  })
  if (request) {
    return withDeletionSubjectLock(request.subjectDigest, async (tx, state) => {
      if (!deletionBlocksBilling(state)) return false
      await bindLateBillingReferences(tx, state, references)
      return true
    })
  }

  const audit = await prisma.accountDeletionAudit.findUnique({
    where: { stripeCustomerDigest: stripeCustomerDigestForId(references.customerId) },
    select: { id: true },
  })
  return Boolean(audit)
}

async function belongsToDeletedAccount(event: Stripe.Event) {
  return interceptDeletedAccount(deletionReferencesFromEvent(event))
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription, priceId: string | null) {
  if (!priceId) return null
  const planItem = subscription.items.data.find((item) => item.price.id === priceId)
  return planItem ? new Date(planItem.current_period_end * 1000) : null
}

async function acquireWebhookEvent(event: Stripe.Event) {
  const object = event.data.object as { id?: string }
  try {
    const created = await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        objectId: object.id ?? null,
        livemode: event.livemode,
        stripeCreatedAt: new Date(event.created * 1000),
      },
    })
    return { state: 'acquired' as const, attempt: created.attempts }
  } catch (error) {
    if (!isUniqueConflict(error)) throw error
  }

  const leaseExpiredBefore = new Date(Date.now() - PROCESSING_LEASE_MS)
  const claimed = await prisma.stripeWebhookEvent.updateMany({
    where: {
      eventId: event.id,
      OR: [
        { status: 'FAILED' },
        { status: 'PROCESSING', updatedAt: { lt: leaseExpiredBefore } },
      ],
    },
    data: {
      status: 'PROCESSING',
      attempts: { increment: 1 },
      error: null,
      processedAt: null,
      updatedAt: new Date(),
    },
  })
  if (claimed.count !== 1) {
    const existing = await prisma.stripeWebhookEvent.findUniqueOrThrow({ where: { eventId: event.id } })
    return existing.status === 'PROCESSED'
      ? { state: 'processed' as const }
      : { state: 'in_progress' as const }
  }

  const reclaimed = await prisma.stripeWebhookEvent.findUniqueOrThrow({ where: { eventId: event.id } })
  return { state: 'acquired' as const, attempt: reclaimed.attempts }
}

async function markWebhookProcessed(eventId: string, attempt: number) {
  const marked = await prisma.stripeWebhookEvent.updateMany({
    where: { eventId, status: 'PROCESSING', attempts: attempt },
    data: { status: 'PROCESSED', processedAt: new Date(), error: null },
  })
  if (marked.count !== 1) {
    throw new RetryableBillingError('Webhook processing lease was lost before completion')
  }
}

async function markWebhookFailed(eventId: string, attempt: number, error: unknown) {
  const code = stableWebhookErrorCode(error)
  await prisma.stripeWebhookEvent.updateMany({
    where: { eventId, status: 'PROCESSING', attempts: attempt },
    data: { status: 'FAILED', error: code },
  })
}

function stableWebhookErrorCode(error: unknown) {
  if (error instanceof RetryableBillingError) return 'RETRYABLE_BILLING'
  if (error instanceof Prisma.PrismaClientKnownRequestError) return `PRISMA_${error.code}`
  if (error instanceof Stripe.errors.StripeAuthenticationError) return 'STRIPE_AUTHENTICATION'
  if (error instanceof Stripe.errors.StripePermissionError) return 'STRIPE_PERMISSION'
  if (error instanceof Stripe.errors.StripeRateLimitError) return 'STRIPE_RATE_LIMIT'
  if (error instanceof Stripe.errors.StripeConnectionError) return 'STRIPE_CONNECTION'
  return 'BILLING_PROCESSING_FAILED'
}

async function grantPotion(session: Stripe.Checkout.Session) {
  const intent = await prisma.checkoutIntent.findUnique({ where: { stripeCheckoutSessionId: session.id } })
  if (!intent) throw new RetryableBillingError('Checkout intent relationship is not available yet')
  if (session.payment_status !== 'paid') return

  const potion = validatePotionCheckout({ session, intent })
  const sourceType = 'STRIPE_CHECKOUT_SESSION'
  const references = {
    userId: intent.userId,
    customerId: stripeId(session.customer),
    subscriptionId: stripeId(session.subscription),
  }

  try {
    return await withUserDeletionLock(intent.userId, async (tx, state) => {
      if (deletionBlocksBilling(state)) {
        await bindLateBillingReferences(tx, state, references)
        return { deleted: true }
      }

      await tx.creditLedgerEntry.create({
          data: {
            userId: intent.userId,
            delta: potion.quests,
            reason: 'POTION_PURCHASE',
            sourceType,
            sourceId: session.id,
          },
        })
        await tx.user.update({
          where: { id: intent.userId },
          data: { questsRemaining: { increment: potion.quests } },
        })
        await tx.checkoutIntent.update({
          where: { id: intent.id },
          data: { status: 'COMPLETED', activeKey: null },
        })
        return { deleted: false }
    })
  } catch (error) {
    if (!isUniqueConflict(error)) throw error
    return withUserDeletionLock(intent.userId, async (tx, state) => {
      if (deletionBlocksBilling(state)) {
        await bindLateBillingReferences(tx, state, references)
        return { deleted: true }
      }
      const ledger = await tx.creditLedgerEntry.findUnique({
        where: { sourceType_sourceId: { sourceType, sourceId: session.id } },
      })
      if (!ledger || ledger.userId !== intent.userId || ledger.delta !== potion.quests) throw error
      await tx.checkoutIntent.update({
        where: { id: intent.id },
        data: { status: 'COMPLETED', activeKey: null },
      })
      return { deleted: false }
    })
  }
}

async function resolveSubscriptionUser(subscription: Stripe.Subscription, intentUserId?: string) {
  const customerId = stripeId(subscription.customer)
  if (!customerId) throw new RetryableBillingError('Stripe subscription has no customer')

  const [bySubscription, byCustomer] = await Promise.all([
    prisma.billingSubscription.findUnique({ where: { stripeSubscriptionId: subscription.id } }),
    prisma.billingSubscription.findUnique({ where: { stripeCustomerId: customerId } }),
  ])
  const claimedUserIds = [
    intentUserId,
    subscription.metadata.userId,
    bySubscription?.userId,
    byCustomer?.userId,
  ].filter((value): value is string => Boolean(value))
  const userId = claimedUserIds[0]
  if (!userId) {
    const deleted = await interceptDeletedAccount({
      customerId,
      subscriptionId: subscription.id,
    })
    if (deleted) return { deleted: true as const, customerId }
    throw new RetryableBillingError('Subscription user relationship is not available yet')
  }
  if (claimedUserIds.some((claimedUserId) => claimedUserId !== userId)) {
    throw new RetryableBillingError('Stripe subscription and customer links conflict')
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) {
    const deleted = await interceptDeletedAccount({ userId, customerId, subscriptionId: subscription.id })
    if (deleted) return { deleted: true as const, userId, customerId }
    throw new RetryableBillingError('Subscription user does not exist')
  }
  return { deleted: false as const, userId, customerId }
}

async function reconcileSubscription(input: {
  stripe: Stripe
  subscriptionId: string
  eventCreatedAt: Date
  expectedIntent?: {
    id: string
    userId: string
    kind: string
    sku: string
  }
  onReconciled?: (resolved: {
    userId: string
    customerId: string
    priceId: string | null
    resolvedPlan: keyof typeof PLAN_CATALOG | null
    subscription: Stripe.Subscription
  }, tx: DeletionSubjectTransaction) => Promise<void>
}) {
  const subscription = await input.stripe.subscriptions.retrieve(input.subscriptionId)
  const identity = await resolveSubscriptionUser(subscription, input.expectedIntent?.userId)
  if (identity.deleted) return { deleted: true as const }
  const { userId, customerId } = identity
  const priceId = subscription.items.data[0]?.price.id ?? null
  const resolvedPlan = priceId ? planCodeForStripePrice(priceId) : null

  if (input.expectedIntent) {
    if (input.expectedIntent.kind !== 'SUBSCRIPTION' || !isPlanCode(input.expectedIntent.sku)) {
      throw new RetryableBillingError('Invalid subscription Checkout intent')
    }
    const expectedPrice = input.expectedIntent.sku === 'FREE'
      ? null
      : stripePriceIdForPlan(input.expectedIntent.sku)
    if (!expectedPrice || priceId !== expectedPrice || resolvedPlan !== input.expectedIntent.sku) {
      throw new RetryableBillingError('Subscription price does not match the persisted order')
    }
  }

  const effectivePlan = resolvedPlan && PLAN_CATALOG[resolvedPlan].enabled ? resolvedPlan : 'FREE'
  return withUserDeletionLock(userId, async (tx, state) => {
    if (deletionBlocksBilling(state)) {
      await bindLateBillingReferences(tx, state, {
        userId,
        customerId,
        subscriptionId: subscription.id,
      })
      return { deleted: true as const }
    }

    const current = await tx.billingSubscription.findUnique({ where: { userId } })
    const isCurrentOrNewer = !current?.latestStripeEventCreatedAt ||
      current.latestStripeEventCreatedAt <= input.eventCreatedAt

    if (isCurrentOrNewer) {
      await tx.billingSubscription.upsert({
        where: { userId },
        update: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          plan: effectivePlan,
          status: subscription.status,
          currentPeriodEnd: subscriptionPeriodEnd(subscription, priceId),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          latestStripeEventCreatedAt: input.eventCreatedAt,
        },
        create: {
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          plan: effectivePlan,
          status: subscription.status,
          currentPeriodEnd: subscriptionPeriodEnd(subscription, priceId),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          latestStripeEventCreatedAt: input.eventCreatedAt,
        },
      })
    }

    if (input.expectedIntent) {
      await tx.checkoutIntent.update({
        where: { id: input.expectedIntent.id },
        data: { status: 'COMPLETED', activeKey: null },
      })
    }

    const resolved = {
      deleted: false as const,
      userId,
      customerId,
      priceId,
      resolvedPlan,
      subscription,
    }
    await input.onReconciled?.(resolved, tx)
    return resolved
  })
}

async function processPaidInvoice(stripe: Stripe, invoice: Stripe.Invoice, eventCreatedAt: Date) {
  // A paid zero-dollar trial/discount invoice is valid, but did not collect a
  // paid period. Record the webhook without minting a balance.
  if (invoice.status === 'paid' && invoice.amount_paid <= 0) return

  const subscriptionId = subscriptionIdFromInvoice(invoice)
  if (!subscriptionId) throw new RetryableBillingError('Invoice subscription relationship is not available yet')

  await reconcileSubscription({
    stripe,
    subscriptionId,
    eventCreatedAt,
    onReconciled: async (resolved, tx) => {
      const allocation = validatePaidPlanInvoice({
        invoice,
        subscription: resolved.subscription,
        plan: resolved.resolvedPlan,
        expectedPriceId: resolved.priceId,
      })
      if (!allocation) return

      await CreditService.grantInvoiceAllocation({
        userId: resolved.userId,
        credits: allocation.credits,
        sourceType: 'STRIPE_INVOICE',
        sourceId: invoice.id,
        reason: 'PLAN_PERIOD_ALLOCATION',
      }, tx)
    },
  })
}

async function processCheckout(stripe: Stripe, session: Stripe.Checkout.Session, eventCreatedAt: Date) {
  const intent = await prisma.checkoutIntent.findUnique({ where: { stripeCheckoutSessionId: session.id } })
  if (!intent) throw new RetryableBillingError('Checkout intent relationship is not available yet')

  if (intent.kind === 'POTION') {
    await grantPotion(session)
    return
  }

  if (intent.kind !== 'SUBSCRIPTION' || session.mode !== 'subscription') {
    throw new RetryableBillingError('Checkout mode does not match the persisted order')
  }
  if (session.client_reference_id !== intent.userId || session.metadata?.checkoutIntentId !== intent.id) {
    throw new RetryableBillingError('Subscription Checkout ownership did not match')
  }

  const subscriptionId = stripeId(session.subscription)
  if (!subscriptionId) throw new RetryableBillingError('Checkout has no Stripe subscription')
  await reconcileSubscription({
    stripe,
    subscriptionId,
    eventCreatedAt,
    expectedIntent: intent,
  })
}

async function expireCheckout(session: Stripe.Checkout.Session) {
  const intent = await prisma.checkoutIntent.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    select: { id: true, userId: true },
  })
  if (!intent) return

  await withUserDeletionLock(intent.userId, async (tx, state) => {
    if (deletionBlocksBilling(state)) {
      await bindLateBillingReferences(tx, state, {
        userId: intent.userId,
        customerId: stripeId(session.customer),
        subscriptionId: stripeId(session.subscription),
      })
      return
    }
    await tx.checkoutIntent.updateMany({
      where: { id: intent.id },
      data: { status: 'EXPIRED', activeKey: null },
    })
  })
}

async function processRecognizedEvent(stripe: Stripe, event: Stripe.Event) {
  const eventCreatedAt = new Date(event.created * 1000)

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    await processCheckout(stripe, event.data.object, eventCreatedAt)
    return
  }

  if (event.type === 'checkout.session.expired') {
    await expireCheckout(event.data.object)
    return
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    await reconcileSubscription({
      stripe,
      subscriptionId: event.data.object.id,
      eventCreatedAt,
    })
    return
  }

  if (event.type === 'invoice.paid') {
    await processPaidInvoice(stripe, event.data.object, eventCreatedAt)
  }
}

export class WebhookService {
  static recognizes(eventType: string) {
    return RECOGNIZED_EVENTS.has(eventType)
  }

  static async process(stripe: Stripe, event: Stripe.Event) {
    if (!this.recognizes(event.type)) return { recognized: false, duplicate: false, inProgress: false }
    if (event.livemode !== validateStripeRuntimeMode()) {
      throw new RetryableBillingError('Stripe event livemode does not match this environment')
    }
    const lease = await acquireWebhookEvent(event)
    if (lease.state === 'processed') return { recognized: true, duplicate: true, inProgress: false }
    if (lease.state === 'in_progress') return { recognized: true, duplicate: false, inProgress: true }

    try {
      // Customer deletion can emit subscription events after the local user and
      // billing rows are gone. A keyed, PII-free tombstone makes those events a
      // terminal success instead of an infinite retry or account resurrection.
      if (await belongsToDeletedAccount(event)) {
        await markWebhookProcessed(event.id, lease.attempt)
        return { recognized: true, duplicate: false, inProgress: false }
      }
      await processRecognizedEvent(stripe, event)
      await markWebhookProcessed(event.id, lease.attempt)
      return { recognized: true, duplicate: false, inProgress: false }
    } catch (error) {
      await markWebhookFailed(event.id, lease.attempt, error)
      throw error
    }
  }
}

export const BILLING_WEBHOOK_TESTING = {
  PROCESSING_LEASE_MS,
  acquireWebhookEvent,
  expectedStripeLivemode,
  expireCheckout,
  belongsToDeletedAccount,
  deletionReferencesFromEvent,
  interceptDeletedAccount,
  markWebhookFailed,
  markWebhookProcessed,
  stableWebhookErrorCode,
  validateStripeRuntimeMode,
  processPaidInvoice,
  processRecognizedEvent,
  reconcileSubscription,
}
