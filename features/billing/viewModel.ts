import 'server-only'

import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import { EntitlementService } from '@/src/modules/billing/application/EntitlementService'
import { FOUNDER_LOCK_TERMS, type PlanCode } from '@/src/modules/billing/domain/catalog'
import { FounderSeatService } from '@/src/modules/billing/application/FounderSeatService'
import { founderPriceConfigured } from '@/src/modules/billing/infrastructure/stripeCatalog'
import { assertStripeSecretKeyMatchesExpectedMode } from '@/src/modules/billing/infrastructure/stripeEnvironment'
import { getBillingPlanCatalog, type BillingPlanView } from './catalog'

const SCAN_CREDIT_COST = 1
const WORKER_HEARTBEAT_STALE_MS = 3 * 60_000

export type BillingAccountState =
  | 'loading'
  | 'unavailable'
  | 'free'
  | 'paid'
  | 'past_due'
  | 'cancelled'
  | 'misconfigured'

export type BillingAvailabilityState = 'available' | 'disabled' | 'misconfigured' | 'unavailable'

export type BillingAvailability = {
  state: BillingAvailabilityState
  label: string
  reason: string
}

export type FounderPassView = {
  limit: number
  claimed: number
  reserved: number
  remaining: number
  soldOut: boolean
  sellable: boolean
  priceConfigured: boolean
  lockTerms: readonly string[]
}

export type CheckoutReturnNotice = {
  state: 'none' | 'pending' | 'cancelled' | 'verified' | 'unmatched'
  title: string
  message: string
}

export type BillingLoadingViewModel = {
  status: 'loading'
  title: string
  message: string
}

export type BillingUnavailableViewModel = {
  status: 'unavailable'
  title: string
  message: string
}

export type BillingReadyViewModel = {
  status: Exclude<BillingAccountState, 'loading' | 'unavailable'>
  checkedAt: string
  currency: {
    code: 'USD'
    label: 'US dollars'
    checkoutDisclosure: string
  }
  subscription: {
    plan: PlanCode
    planName: string
    providerStatus: string
    statusLabel: string
    paid: boolean
    periodEnd: string | null
    periodEndLabel: string | null
    cancelAtPeriodEnd: boolean
    renewalLabel: string
  }
  credits: {
    balance: number
    highestRecordedBalance: number
    estimatedScanCost: typeof SCAN_CREDIT_COST
    estimatedBalanceAfterScan: number
    explanation: string
    refundExplanation: string
  }
  scan: {
    eligible: boolean
    label: string
    reason: string
    activeKeywordCount: number
  }
  availability: {
    payment: BillingAvailability
    checkout: BillingAvailability
    worker: BillingAvailability
    portal: BillingAvailability
    creditTopUps: BillingAvailability
  }
  catalog: BillingPlanView[]
  founderPass: FounderPassView
  checkoutReturn: CheckoutReturnNotice
  support: {
    email: string
    receiptCopy: string
    refundCopy: string
  }
}

export type BillingViewModel =
  | BillingLoadingViewModel
  | BillingUnavailableViewModel
  | BillingReadyViewModel

export const BILLING_LOADING_VIEW_MODEL: BillingLoadingViewModel = {
  status: 'loading',
  title: 'Checking your billing account…',
  message: 'No plan, balance, or paid access is shown until the server confirms it.',
}

export const BILLING_UNAVAILABLE_VIEW_MODEL: BillingUnavailableViewModel = {
  status: 'unavailable',
  title: 'Billing verification is unavailable.',
  message: 'No plan, balance, paid access, or checkout availability is being assumed. Refresh to retry.',
}

function hasValue(name: keyof NodeJS.ProcessEnv) {
  return Boolean(process.env[name]?.trim())
}

function siteUrlReady() {
  const configured = process.env.NEXTAUTH_URL?.trim()
  if (!configured) return false
  try {
    const url = new URL(configured)
    return process.env.NODE_ENV === 'production'
      ? url.protocol === 'https:'
      : url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function stripeSecretReady() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) return false
  try {
    assertStripeSecretKeyMatchesExpectedMode(secret)
    return true
  } catch {
    return false
  }
}

function checkoutConfiguration() {
  const launchGate = process.env.ENABLE_BETA_CHECKOUT === 'true'
  const serviceGate = process.env.SUBSCRIPTION_CHECKOUT_ENABLED === 'true'
  const switchEnabled = launchGate && serviceGate
  const switchMismatch = launchGate !== serviceGate
  const paymentReady = stripeSecretReady()
    && hasValue('STRIPE_WEBHOOK_SECRET')
    && process.env.STRIPE_WEBHOOK_SECRET?.trim().startsWith('whsec_') === true
    && hasValue('STRIPE_PRICE_BETA')
    && siteUrlReady()
  return { paymentReady, switchEnabled, switchMismatch }
}

function heartbeatState(heartbeat: {
  lastSucceededAt: Date | null
  lastErrorCode: string | null
} | null, now: Date): BillingAvailability {
  const launchGate = process.env.ENABLE_SCAN_WORKER === 'true'
  const serviceGate = process.env.DURABLE_WORKER_ENABLED === 'true'
  if (launchGate !== serviceGate) {
    return {
      state: 'misconfigured',
      label: 'Worker gate mismatch',
      reason: 'The scan worker launch switches do not agree, so scans fail closed.',
    }
  }
  if (!launchGate || !serviceGate) {
    return {
      state: 'disabled',
      label: 'Scan worker paused',
      reason: 'Queued scans will not run while the production worker switch is off.',
    }
  }
  if (!hasValue('CRON_SECRET')) {
    return {
      state: 'misconfigured',
      label: 'Worker setup incomplete',
      reason: 'The worker cannot be authenticated, so scans fail closed.',
    }
  }
  if (heartbeat?.lastErrorCode) {
    return {
      state: 'unavailable',
      label: 'Scan worker failed',
      reason: 'The last recorded worker cycle failed. Do not spend a credit yet.',
    }
  }
  if (!heartbeat?.lastSucceededAt) {
    return {
      state: 'unavailable',
      label: 'Worker not verified',
      reason: 'No successful worker heartbeat is recorded. Do not spend a credit yet.',
    }
  }
  if (now.getTime() - heartbeat.lastSucceededAt.getTime() > WORKER_HEARTBEAT_STALE_MS) {
    return {
      state: 'unavailable',
      label: 'Worker heartbeat stale',
      reason: 'The scan worker has not completed recently enough to be treated as available.',
    }
  }
  return {
    state: 'available',
    label: 'Scan worker verified',
    reason: 'A recent successful durable-worker heartbeat is recorded.',
  }
}

function accountStatus(input: {
  paid: boolean
  providerStatus: string
  configurationMisconfigured: boolean
}): BillingReadyViewModel['status'] {
  const providerStatus = input.providerStatus.toLowerCase()
  if (providerStatus === 'past_due' || providerStatus === 'unpaid') return 'past_due'
  if (providerStatus === 'canceled' || providerStatus === 'cancelled') return 'cancelled'
  if (input.paid) return 'paid'
  if (input.configurationMisconfigured) return 'misconfigured'
  return 'free'
}

function statusLabel(status: BillingReadyViewModel['status']) {
  return {
    free: 'Free account',
    paid: 'Paid access verified',
    past_due: 'Payment past due',
    cancelled: 'Subscription cancelled',
    misconfigured: 'Billing setup incomplete',
  }[status]
}

function formattedDate(date: Date | null) {
  if (!date) return null
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)
}

function renewalLabel(input: {
  status: BillingReadyViewModel['status']
  periodEndLabel: string | null
  cancelAtPeriodEnd: boolean
}) {
  if (input.status === 'paid' && input.cancelAtPeriodEnd) {
    return input.periodEndLabel
      ? `Cancellation is scheduled. Paid access remains through ${input.periodEndLabel}.`
      : 'Cancellation is scheduled. The period-end date is unavailable.'
  }
  if (input.status === 'paid') {
    return input.periodEndLabel
      ? `Renews on ${input.periodEndLabel} unless cancelled in Stripe.`
      : 'The subscription is active, but the renewal date is unavailable.'
  }
  if (input.status === 'past_due') return 'Payment is past due. Paid scan eligibility is paused.'
  if (input.status === 'cancelled') return 'The subscription is cancelled and will not renew.'
  return 'No paid renewal is scheduled.'
}

function checkoutReturnNotice(input: {
  checkout?: string
  matchingIntent: { status: string; kind: string } | null
  paid: boolean
}): CheckoutReturnNotice {
  if (input.checkout === 'cancelled') {
    return {
      state: 'cancelled',
      title: 'Checkout cancelled',
      message: 'Stripe Checkout was left without a new server-confirmed entitlement. No success is being claimed.',
    }
  }
  if (input.checkout !== 'verifying') {
    return { state: 'none', title: '', message: '' }
  }
  if (!input.matchingIntent) {
    return {
      state: 'unmatched',
      title: 'Checkout return could not be matched',
      message: 'No entitlement is assumed. Refresh once, then contact support if this return belongs to your account.',
    }
  }
  if (input.matchingIntent.kind === 'SUBSCRIPTION' && input.matchingIntent.status === 'COMPLETED' && input.paid) {
    return {
      state: 'verified',
      title: 'Paid access verified',
      message: 'The signed Stripe webhook has updated the server-owned subscription state.',
    }
  }
  return {
    state: 'pending',
    title: 'Checkout returned — verification pending',
    message: 'Returning from Stripe is not proof of payment. Access and credits remain unchanged until the signed webhook is processed.',
  }
}

function scanEligibility(input: {
  paid: boolean
  balance: number
  activeKeywordCount: number
  worker: BillingAvailability
}) {
  if (!input.paid) return { eligible: false, reason: 'An active, webhook-confirmed paid subscription is required.' }
  if (input.balance < SCAN_CREDIT_COST) return { eligible: false, reason: 'At least 1 scan credit is required.' }
  if (input.activeKeywordCount === 0) return { eligible: false, reason: 'Add an active keyword before scanning.' }
  if (input.worker.state !== 'available') return { eligible: false, reason: input.worker.reason }
  return { eligible: true, reason: 'Your verified plan, balance, keyword, and worker state allow one manual scan.' }
}

function validCheckoutSessionId(value?: string) {
  return value && value.length <= 255 && /^cs_[A-Za-z0-9_]+$/.test(value) ? value : null
}

export async function buildBillingViewModel(input: {
  checkout?: string
  sessionId?: string
  now?: Date
} = {}): Promise<BillingViewModel> {
  const now = input.now ?? new Date()
  try {
    const user = await requireCurrentUser()
    const sessionId = input.checkout === 'verifying' ? validCheckoutSessionId(input.sessionId) : null
    const recentIntentCutoff = new Date(now.getTime() - 30 * 60_000)
    const [
      entitlements,
      subscription,
      heartbeat,
      activeKeywordCount,
      matchingIntent,
      recentIntent,
      founderSeatSnapshot,
    ] = await Promise.all([
      EntitlementService.forUser(user.id),
      prisma.billingSubscription.findUnique({
        where: { userId: user.id },
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          stripeCustomerId: true,
        },
      }),
      prisma.operationalHeartbeat.findUnique({
        where: { id: 'durable-worker' },
        select: { lastSucceededAt: true, lastErrorCode: true },
      }),
      prisma.trackedKeyword.count({ where: { userId: user.id, active: true } }),
      sessionId
        ? prisma.checkoutIntent.findFirst({
            where: { userId: user.id, stripeCheckoutSessionId: sessionId },
            select: { status: true, kind: true },
          })
        : Promise.resolve(null),
      prisma.checkoutIntent.findFirst({
        where: {
          userId: user.id,
          kind: 'SUBSCRIPTION',
          status: { in: ['PENDING', 'COMPLETED'] },
          updatedAt: { gte: recentIntentCutoff },
        },
        orderBy: { updatedAt: 'desc' },
        select: { status: true, kind: true },
      }),
      FounderSeatService.snapshot(prisma, now),
    ])

    const checkout = checkoutConfiguration()
    const worker = heartbeatState(heartbeat, now)
    const configurationMisconfigured = checkout.switchMismatch
      || (checkout.switchEnabled && !checkout.paymentReady)
      || worker.state === 'misconfigured'
    const status = accountStatus({
      paid: entitlements.paid,
      providerStatus: subscription?.status ?? entitlements.subscriptionStatus,
      configurationMisconfigured,
    })
    const periodEndLabel = formattedDate(subscription?.currentPeriodEnd ?? null)
    const scan = scanEligibility({
      paid: entitlements.paid,
      balance: user.questsRemaining,
      activeKeywordCount,
      worker,
    })
    const payment: BillingAvailability = checkout.paymentReady
      ? {
          state: 'available',
          label: 'Payment configuration verified',
          reason: 'The server has the required local Stripe, price, webhook, URL, and mode configuration.',
        }
      : {
          state: checkout.switchEnabled ? 'misconfigured' : 'unavailable',
          label: checkout.switchEnabled ? 'Payment setup incomplete' : 'Payment unavailable',
          reason: 'The server cannot verify every required payment setting. No charge can be started.',
        }
    const checkoutAvailability: BillingAvailability = checkout.switchMismatch
      ? {
          state: 'misconfigured',
          label: 'Checkout gate mismatch',
          reason: 'The billing launch switches do not agree, so checkout fails closed.',
        }
      : !checkout.switchEnabled
        ? {
            state: 'disabled',
            label: 'Checkout paused',
            reason: 'Beta checkout is default-off until both production launch switches are enabled.',
          }
        : !checkout.paymentReady
          ? {
              state: 'misconfigured',
              label: 'Checkout unavailable',
              reason: 'Checkout is enabled but required payment configuration is incomplete.',
            }
          : worker.state !== 'available'
            ? {
                state: worker.state === 'misconfigured' ? 'misconfigured' : 'unavailable',
                label: 'Checkout paused for worker readiness',
                reason: 'A paid plan cannot be sold until a recent successful scan-worker heartbeat is verified.',
              }
          : {
              state: 'available',
              label: 'Checkout available',
              reason: 'The launch switches and local payment configuration are ready.',
            }
    const portalReady = stripeSecretReady() && siteUrlReady() && Boolean(subscription?.stripeCustomerId)
    const portal: BillingAvailability = portalReady
      ? {
          state: 'available',
          label: 'Billing management available',
          reason: 'Open Stripe to manage cancellation and available invoices or receipts.',
        }
      : {
          state: 'unavailable',
          label: 'Billing management unavailable',
          reason: 'No usable Stripe billing account and server configuration are currently verified.',
        }

    return {
      status,
      checkedAt: now.toISOString(),
      currency: {
        code: 'USD',
        label: 'US dollars',
        checkoutDisclosure: 'The final USD total and any tax charged are shown in Stripe Checkout before confirmation.',
      },
      subscription: {
        plan: entitlements.plan,
        planName: entitlements.planName,
        providerStatus: subscription?.status ?? entitlements.subscriptionStatus,
        statusLabel: statusLabel(status),
        paid: entitlements.paid,
        periodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
        periodEndLabel,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        renewalLabel: renewalLabel({
          status,
          periodEndLabel,
          cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        }),
      },
      credits: {
        balance: user.questsRemaining,
        highestRecordedBalance: user.maxCredits,
        estimatedScanCost: SCAN_CREDIT_COST,
        estimatedBalanceAfterScan: scan.eligible
          ? Math.max(0, user.questsRemaining - SCAN_CREDIT_COST)
          : user.questsRemaining,
        explanation: 'One credit is debited only when a new manual scan is durably queued. Repeated requests in the same scan window do not create another debit.',
        refundExplanation: 'A terminal provider failure returns one credit only when the server ledger records the refund. A zero-result successful scan still costs one credit.',
      },
      scan: {
        eligible: scan.eligible,
        label: scan.eligible ? 'Eligible for one manual scan' : 'Manual scan unavailable',
        reason: scan.reason,
        activeKeywordCount,
      },
      availability: {
        payment,
        checkout: checkoutAvailability,
        worker,
        portal,
        creditTopUps: {
          state: 'disabled',
          label: 'Credit top-ups not for sale',
          reason: 'Top-ups remain disabled until refund and dispute credit reversals are implemented and tested.',
        },
      },
      catalog: getBillingPlanCatalog(),
      founderPass: {
        ...founderSeatSnapshot,
        // Seats can remain while the offer itself is unsellable — the Founder
        // Price has to be configured before the card may claim to be buyable.
        sellable:
          founderPriceConfigured()
          && !founderSeatSnapshot.soldOut
          && checkoutAvailability.state === 'available',
        priceConfigured: founderPriceConfigured(),
        lockTerms: FOUNDER_LOCK_TERMS,
      },
      checkoutReturn: checkoutReturnNotice({
        checkout: input.checkout ?? (recentIntent ? 'verifying' : undefined),
        matchingIntent: input.checkout === 'verifying'
          ? matchingIntent
          : recentIntent,
        paid: entitlements.paid,
      }),
      support: {
        email: 'support@seolaquest.com',
        receiptCopy: 'Use Stripe billing management for invoices or receipts available on your account. Email delivery depends on the Stripe checkout and invoice settings in effect at payment time.',
        refundCopy: 'Consumed credits are not automatically restored. Contact support for billing disputes or refund requests; applicable consumer rights are not waived.',
      },
    }
  } catch {
    return BILLING_UNAVAILABLE_VIEW_MODEL
  }
}

export const BILLING_VIEW_MODEL_TESTING = {
  accountStatus,
  checkoutConfiguration,
  checkoutReturnNotice,
  heartbeatState,
  scanEligibility,
  validCheckoutSessionId,
}
