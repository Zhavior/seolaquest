import 'server-only'

import { Prisma } from '@prisma/client'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import { EntitlementService } from '@/src/modules/billing/application/EntitlementService'
import {
  PLAN_CATALOG,
  POTION_CATALOG,
  isPaidPlanCode,
  isPotionId,
} from '@/src/modules/billing/domain/catalog'
import { isNonterminalSubscriptionStatus } from '@/src/modules/billing/domain/subscriptionStatus'
import { FounderSeatService } from '@/src/modules/billing/application/FounderSeatService'
import { stripePriceIdForPlan } from '@/src/modules/billing/infrastructure/stripeCatalog'
import { assertStripeSecretKeyMatchesExpectedMode } from '@/src/modules/billing/infrastructure/stripeEnvironment'
import {
  deletionBlocksBilling,
  withUserDeletionLock,
} from '@/src/modules/lifecycle/application/DeletionBillingBarrier'

type CheckoutIntentKind = 'SUBSCRIPTION' | 'POTION'

type CheckoutResult = {
  ok: boolean
  message?: string
  url?: string
}

class BillingDeletionBlockedError extends Error {}

function scanWorkerReleaseGateOpen() {
  return process.env.ENABLE_SCAN_WORKER === 'true'
    && process.env.DURABLE_WORKER_ENABLED === 'true'
}

function subscriptionCheckoutReleaseGateOpen() {
  return process.env.ENABLE_BETA_CHECKOUT === 'true'
    && process.env.SUBSCRIPTION_CHECKOUT_ENABLED === 'true'
    && scanWorkerReleaseGateOpen()
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!stripeKey) return null
  try {
    assertStripeSecretKeyMatchesExpectedMode(stripeKey)
    return new Stripe(stripeKey, { timeout: 8_000, maxNetworkRetries: 0 })
  } catch {
    return null
  }
}

function getSiteUrl() {
  const configured = process.env.NEXTAUTH_URL?.trim()
  if (!configured) return null

  try {
    const url = new URL(configured)
    const protocolAllowed = process.env.NODE_ENV === 'production'
      ? url.protocol === 'https:'
      : url.protocol === 'http:' || url.protocol === 'https:'
    if (!protocolAllowed) return null
    return url.origin
  } catch {
    return null
  }
}

async function reusableCheckoutUrl(stripe: Stripe, intent: {
  id: string
  stripeCheckoutSessionId: string | null
  stripeCheckoutUrl: string | null
}, db: Pick<Prisma.TransactionClient, 'checkoutIntent'> = prisma) {
  if (!intent.stripeCheckoutSessionId || !intent.stripeCheckoutUrl) return { state: 'replace' as const }

  const session = await stripe.checkout.sessions.retrieve(intent.stripeCheckoutSessionId)
  if (session.status === 'open') {
    return { state: 'reuse' as const, url: intent.stripeCheckoutUrl }
  }
  if (session.status === 'complete') {
    return { state: 'verifying' as const }
  }

  await db.checkoutIntent.update({
    where: { id: intent.id },
    data: { status: 'EXPIRED', activeKey: null, stripeCheckoutUrl: null },
  })
  return { state: 'replace' as const }
}

async function getOrCreateCustomer(
  stripe: Stripe,
  user: { id: string; email: string },
  db: Pick<Prisma.TransactionClient, 'billingSubscription'>,
) {
  const existing = await db.billingSubscription.findUnique({ where: { userId: user.id } })
  if (existing) return { customerId: existing.stripeCustomerId, created: false }

  const customer = await stripe.customers.create(
    {
      email: user.email,
      metadata: { userId: user.id },
    },
    { idempotencyKey: `billing-customer:${user.id}` },
  )

  const subscription = await db.billingSubscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      stripeCustomerId: customer.id,
      plan: 'FREE',
      status: 'inactive',
    },
  })

  return { customerId: subscription.stripeCustomerId, created: true }
}

async function getOrCreateIntent(input: {
  userId: string
  kind: CheckoutIntentKind
  sku: string
  expectedAmount: number | null
  currency: string
}, db: Pick<Prisma.TransactionClient, 'checkoutIntent'> = prisma) {
  const activeKey = `${input.kind}:${input.userId}:${input.sku}`
  const existing = await db.checkoutIntent.findUnique({ where: { activeKey } })
  if (existing) return existing

  try {
    return await db.checkoutIntent.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        sku: input.sku,
        expectedAmount: input.expectedAmount,
        currency: input.currency,
        activeKey,
      },
    })
  } catch (error) {
    if (!isUniqueConflict(error)) throw error
    return db.checkoutIntent.findUniqueOrThrow({ where: { activeKey } })
  }
}

async function compensateCreatedCustomer(stripe: Stripe, customerId: string | null) {
  if (!customerId) return
  try {
    await stripe.customers.del(customerId)
  } catch {
    // The idempotent customer key lets a later attempt recover the same Stripe
    // object. Never conceal the original failed checkout behind cleanup errors.
  }
}

async function compensateCheckoutResources(
  stripe: Stripe,
  input: { checkoutSessionId: string | null; createdCustomerId: string | null },
) {
  if (input.checkoutSessionId) {
    try {
      await stripe.checkout.sessions.expire(input.checkoutSessionId)
    } catch {
      // A completed or provider-unreachable Session cannot be expired here.
      // Idempotent webhook reconciliation remains the recovery boundary.
    }
  }
  await compensateCreatedCustomer(stripe, input.createdCustomerId)
}

export class BillingService {
  static async createCheckout(planInput: string): Promise<CheckoutResult> {
    const user = await requireCurrentUser()
    if (!isPaidPlanCode(planInput)) return { ok: false, message: 'Invalid plan.' }

    const plan = PLAN_CATALOG[planInput]
    if (!plan.enabled) return { ok: false, message: 'That plan is not available yet.' }
    if (!subscriptionCheckoutReleaseGateOpen()) {
      return { ok: false, message: 'Subscription checkout is temporarily unavailable. No charge was made.' }
    }

    const preliminarySubscription = await prisma.billingSubscription.findUnique({ where: { userId: user.id } })
    if (
      preliminarySubscription?.stripeSubscriptionId &&
      isNonterminalSubscriptionStatus(preliminarySubscription.status)
    ) {
      return { ok: false, message: 'A subscription is already active. Use Manage billing to change it.' }
    }

    const stripe = getStripe()
    const priceId = stripePriceIdForPlan(planInput)
    const siteUrl = getSiteUrl()
    if (!stripe || !priceId || !siteUrl) {
      return { ok: false, message: 'Checkout is unavailable. No charge was made.' }
    }

    let createdCustomerId: string | null = null
    let createdCheckoutSessionId: string | null = null
    try {
      return await withUserDeletionLock(user.id, async (tx, deletionState) => {
        if (deletionBlocksBilling(deletionState)) throw new BillingDeletionBlockedError()

        const existingSubscription = await tx.billingSubscription.findUnique({ where: { userId: user.id } })
        if (
          existingSubscription?.stripeSubscriptionId &&
          isNonterminalSubscriptionStatus(existingSubscription.status)
        ) {
          return { ok: false, message: 'A subscription is already active. Use Manage billing to change it.' }
        }

        // The Founder Pass seat cap. Taken before any Stripe object exists, so a
        // sold-out attempt needs no compensation. The lock is what makes the
        // count-then-decide safe: without it two hunters can both read the last
        // free seat, and the price lock makes overselling permanent.
        if (plan.code === 'FOUNDER') {
          await FounderSeatService.lockSeatPool(tx)
          if (!(await FounderSeatService.hasSeatAvailable(tx, user.id))) {
            return {
              ok: false,
              message: `All ${FounderSeatService.limit} Founder Pass seats are taken. No charge was made.`,
            }
          }
        }

        const customer = await getOrCreateCustomer(stripe, user, tx)
        if (customer.created) createdCustomerId = customer.customerId
        const liveSubscriptions = await stripe.subscriptions.list({
          customer: customer.customerId,
          status: 'all',
          limit: 100,
        })
        if (liveSubscriptions.data.some((subscription) => isNonterminalSubscriptionStatus(subscription.status))) {
          return { ok: false, message: 'Stripe already has a nonterminal subscription for this account. Use Manage billing.' }
        }

        let intent = await getOrCreateIntent({
          userId: user.id,
          kind: 'SUBSCRIPTION',
          sku: plan.code,
          expectedAmount: null,
          currency: 'usd',
        }, tx)
        if (intent.stripeCheckoutUrl) {
          const existing = await reusableCheckoutUrl(stripe, intent, tx)
          if (existing.state === 'reuse') {
            // Handing back a still-open Session keeps the seat in play, so the
            // reservation has to be extended with it. The path below that mints
            // a new Session writes the intent anyway, which re-stamps it.
            if (plan.code === 'FOUNDER') await FounderSeatService.touchReservation(tx, intent.id)
            return { ok: true, url: existing.url }
          }
          if (existing.state === 'verifying') {
            return { ok: false, message: 'Your completed Checkout is being verified. No new charge was started.' }
          }
          intent = await getOrCreateIntent({
            userId: user.id,
            kind: 'SUBSCRIPTION',
            sku: plan.code,
            expectedAmount: null,
            currency: 'usd',
          }, tx)
        }

        const metadata = {
          checkoutIntentId: intent.id,
          userId: user.id,
          kind: 'SUBSCRIPTION',
          sku: plan.code,
        }
        const session = await stripe.checkout.sessions.create(
          {
            mode: 'subscription',
            customer: customer.customerId,
            client_reference_id: user.id,
            metadata,
            subscription_data: { metadata },
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${siteUrl}/billing?checkout=verifying&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/billing?checkout=cancelled`,
          },
          { idempotencyKey: `checkout:${intent.id}` },
        )
        createdCheckoutSessionId = session.id

        // Upstream contract violation, not a user error: a successfully created Checkout
        // Session always carries a url. Throwing rolls back the enclosing transaction so
        // the intent is never persisted pointing at a session the user cannot open. 500 is
        // the honest status — the client did nothing wrong and retrying will not help.
        if (!session.url) throw new Error('Stripe Checkout did not return a URL')
        await tx.checkoutIntent.update({
          where: { id: intent.id },
          data: {
            stripeCheckoutSessionId: session.id,
            stripeCheckoutUrl: session.url,
          },
        })
        return { ok: true, url: session.url }
      })
    } catch (error) {
      await compensateCheckoutResources(stripe, { createdCustomerId, checkoutSessionId: createdCheckoutSessionId })
      if (error instanceof BillingDeletionBlockedError) {
        return { ok: false, message: 'Checkout is unavailable while account deletion is pending. No charge was made.' }
      }
      return { ok: false, message: 'Checkout could not be started. No charge was made.' }
    }
  }

  static async createManaCheckout(potionInput: string): Promise<CheckoutResult> {
    const user = await requireCurrentUser()
    if (!isPotionId(potionInput)) return { ok: false, message: 'Invalid potion.' }
    if (process.env.POTION_CHECKOUT_ENABLED !== 'true' || !scanWorkerReleaseGateOpen()) {
      return { ok: false, message: 'Credit top-ups are temporarily unavailable. No charge was made.' }
    }

    const stripe = getStripe()
    const siteUrl = getSiteUrl()
    if (!stripe || !siteUrl) {
      return { ok: false, message: 'Checkout is unavailable. No charge was made.' }
    }

    const potion = POTION_CATALOG[potionInput]
    let createdCustomerId: string | null = null
    let createdCheckoutSessionId: string | null = null
    try {
      return await withUserDeletionLock(user.id, async (tx, deletionState) => {
        if (deletionBlocksBilling(deletionState)) throw new BillingDeletionBlockedError()

        let intent = await getOrCreateIntent({
          userId: user.id,
          kind: 'POTION',
          sku: potion.id,
          expectedAmount: potion.priceCents,
          currency: potion.currency,
        }, tx)
        if (intent.stripeCheckoutUrl) {
          const existing = await reusableCheckoutUrl(stripe, intent, tx)
          if (existing.state === 'reuse') return { ok: true, url: existing.url }
          if (existing.state === 'verifying') {
            return { ok: false, message: 'Your completed Checkout is being verified. No new charge was started.' }
          }
          intent = await getOrCreateIntent({
            userId: user.id,
            kind: 'POTION',
            sku: potion.id,
            expectedAmount: potion.priceCents,
            currency: potion.currency,
          }, tx)
        }

        const customer = await getOrCreateCustomer(stripe, user, tx)
        if (customer.created) createdCustomerId = customer.customerId
        const metadata = {
          checkoutIntentId: intent.id,
          userId: user.id,
          kind: 'POTION',
          sku: potion.id,
        }
        const session = await stripe.checkout.sessions.create(
          {
            mode: 'payment',
            payment_method_types: ['card'],
            customer: customer.customerId,
            client_reference_id: user.id,
            metadata,
            payment_intent_data: { metadata },
            line_items: [
              {
                price_data: {
                  currency: potion.currency,
                  product_data: { name: potion.name },
                  unit_amount: potion.priceCents,
                },
                quantity: 1,
              },
            ],
            success_url: `${siteUrl}/billing?checkout=verifying&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/billing?checkout=cancelled`,
          },
          { idempotencyKey: `checkout:${intent.id}` },
        )
        createdCheckoutSessionId = session.id

        // Upstream contract violation, not a user error: a successfully created Checkout
        // Session always carries a url. Throwing rolls back the enclosing transaction so
        // the intent is never persisted pointing at a session the user cannot open. 500 is
        // the honest status — the client did nothing wrong and retrying will not help.
        if (!session.url) throw new Error('Stripe Checkout did not return a URL')
        await tx.checkoutIntent.update({
          where: { id: intent.id },
          data: {
            stripeCheckoutSessionId: session.id,
            stripeCheckoutUrl: session.url,
          },
        })
        return { ok: true, url: session.url }
      })
    } catch (error) {
      await compensateCheckoutResources(stripe, { createdCustomerId, checkoutSessionId: createdCheckoutSessionId })
      if (error instanceof BillingDeletionBlockedError) {
        return { ok: false, message: 'Checkout is unavailable while account deletion is pending. No charge was made.' }
      }
      return { ok: false, message: 'Checkout could not be started. No charge was made.' }
    }
  }

  static async createPortal(): Promise<CheckoutResult> {
    const user = await requireCurrentUser()
    const stripe = getStripe()
    const siteUrl = getSiteUrl()
    if (!stripe || !siteUrl) return { ok: false, message: 'Billing management is unavailable.' }

    try {
      return await withUserDeletionLock(user.id, async (tx, deletionState) => {
        if (deletionBlocksBilling(deletionState)) throw new BillingDeletionBlockedError()
        const subscription = await tx.billingSubscription.findUnique({ where: { userId: user.id } })
        if (!subscription) return { ok: false, message: 'No Stripe billing account is linked yet.' }

        const session = await stripe.billingPortal.sessions.create({
          customer: subscription.stripeCustomerId,
          return_url: `${siteUrl}/billing`,
        })
        return { ok: true, url: session.url }
      })
    } catch (error) {
      if (error instanceof BillingDeletionBlockedError) {
        return { ok: false, message: 'Billing management is unavailable while account deletion is pending.' }
      }
      return { ok: false, message: 'Billing management could not be opened.' }
    }
  }

  static async getCurrentState() {
    const user = await requireCurrentUser()
    const entitlements = await EntitlementService.forUser(user.id)

    return {
      plan: entitlements.plan,
      planName: entitlements.planName,
      subscriptionStatus: entitlements.subscriptionStatus,
      paid: entitlements.paid,
      scanLimit: entitlements.scanLimit,
      questsRemaining: user.questsRemaining,
      maxCredits: user.maxCredits,
      subscriptionCheckoutEnabled: subscriptionCheckoutReleaseGateOpen(),
      potionCheckoutEnabled: process.env.POTION_CHECKOUT_ENABLED === 'true' && scanWorkerReleaseGateOpen(),
    }
  }
}

export const BILLING_TESTING = {
  BillingDeletionBlockedError,
  compensateCheckoutResources,
  compensateCreatedCustomer,
  getOrCreateCustomer,
  getSiteUrl,
  isUniqueConflict,
  reusableCheckoutUrl,
  scanWorkerReleaseGateOpen,
  subscriptionCheckoutReleaseGateOpen,
}
