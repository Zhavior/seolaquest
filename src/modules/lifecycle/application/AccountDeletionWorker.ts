import 'server-only'

import { randomUUID } from 'node:crypto'
import type { AccountDeletionRequest } from '@prisma/client'
import { Prisma } from '@prisma/client'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { assertStripeSecretKeyMatchesExpectedMode } from '@/src/modules/billing/infrastructure/stripeEnvironment'
import { lockDeletionSubject } from '@/src/modules/lifecycle/application/DeletionBillingBarrier'
import {
  assertAccountDeletionConfigurationReady,
  requireDeletionAuditSecret,
  stripeCustomerDigestForId,
} from '@/src/modules/lifecycle/domain/accountDeletion'

const LEASE_MS = 5 * 60 * 1000
const MAX_BATCH_SIZE = 25
const DEFAULT_BATCH_SIZE = 2
const STRIPE_TIMEOUT_MS = 8_000
const INITIAL_RETRY_SECONDS = 30
const MAX_RETRY_SECONDS = 60 * 60

type DeletionStripeClient = Pick<Stripe, 'customers'>

type ClaimedDeletionRequest = Pick<
  AccountDeletionRequest,
  | 'id'
  | 'subjectDigest'
  | 'userId'
  | 'source'
  | 'stripeCustomerId'
  | 'stripeSubscriptionId'
  | 'attempts'
  | 'maxAttempts'
  | 'leaseToken'
>

type ProcessResult = 'completed' | 'retry' | 'dead' | 'lease_lost'
type LocalDeletionResult = 'completed' | 'billing_binding_changed'

export class AccountDeletionLeaseLostError extends Error {
  constructor() {
    super('Account deletion lease was lost')
    this.name = 'AccountDeletionLeaseLostError'
  }
}

function boundedBatchSize(limit: number | undefined) {
  if (!Number.isSafeInteger(limit) || !limit || limit < 1) return DEFAULT_BATCH_SIZE
  return Math.min(limit, MAX_BATCH_SIZE)
}

function retryAt(attempts: number, now: Date) {
  const seconds = Math.min(
    INITIAL_RETRY_SECONDS * (2 ** Math.max(0, attempts - 1)),
    MAX_RETRY_SECONDS,
  )
  return new Date(now.getTime() + seconds * 1000)
}

function stableStripeErrorCode(error: unknown) {
  if (error instanceof Stripe.errors.StripeAuthenticationError) return 'STRIPE_AUTHENTICATION'
  if (error instanceof Stripe.errors.StripePermissionError) return 'STRIPE_PERMISSION'
  if (error instanceof Stripe.errors.StripeRateLimitError) return 'STRIPE_RATE_LIMIT'
  if (error instanceof Stripe.errors.StripeConnectionError) return 'STRIPE_CONNECTION'
  return 'STRIPE_CUSTOMER_DELETE_FAILED'
}

function isStripeResourceMissing(error: unknown) {
  return error instanceof Stripe.errors.StripeInvalidRequestError && error.code === 'resource_missing'
}

function configuredStripeClient(): DeletionStripeClient {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new Error('STRIPE_NOT_CONFIGURED')
  assertStripeSecretKeyMatchesExpectedMode(key)
  // The durable queue owns retries. Bound each provider call so the deletion
  // lane cannot consume the whole cron invocation before normal jobs run.
  return new Stripe(key, { timeout: STRIPE_TIMEOUT_MS, maxNetworkRetries: 0 })
}

async function claimRequests(input: { limit?: number; now: Date; leaseToken: string }) {
  const limit = boundedBatchSize(input.limit)
  const leaseExpiresAt = new Date(input.now.getTime() + LEASE_MS)

  return prisma.$queryRaw<ClaimedDeletionRequest[]>(Prisma.sql`
    WITH exhausted_candidates AS (
      SELECT exhausted_request."id"
      FROM "AccountDeletionRequest" AS exhausted_request
      WHERE exhausted_request."status" = 'RUNNING'
        AND exhausted_request."leaseExpiresAt" < ${input.now}
        AND exhausted_request."attempts" >= exhausted_request."maxAttempts"
      ORDER BY exhausted_request."leaseExpiresAt", exhausted_request."createdAt", exhausted_request."id"
      LIMIT ${limit}
      FOR UPDATE OF exhausted_request SKIP LOCKED
    ), exhausted AS (
      UPDATE "AccountDeletionRequest" AS exhausted_request
      SET
        "status" = 'DEAD',
        "leaseToken" = NULL,
        "leaseExpiresAt" = NULL,
        "lastErrorCode" = 'LEASE_EXPIRED_AT_MAX_ATTEMPTS',
        "updatedAt" = ${input.now}
      FROM exhausted_candidates
      WHERE exhausted_request."id" = exhausted_candidates."id"
      RETURNING exhausted_request."id"
    ), candidates AS (
      SELECT "id"
      FROM "AccountDeletionRequest"
      WHERE (
        ("status" IN ('PENDING', 'RETRY_WAIT') AND "availableAt" <= ${input.now})
        OR ("status" = 'RUNNING' AND "leaseExpiresAt" < ${input.now})
      )
      AND "attempts" < "maxAttempts"
      ORDER BY "availableAt" ASC, "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE "AccountDeletionRequest" AS request
    SET
      "status" = 'RUNNING',
      "attempts" = request."attempts" + 1,
      "leaseToken" = ${input.leaseToken},
      "leaseExpiresAt" = ${leaseExpiresAt},
      "lastErrorCode" = NULL,
      "updatedAt" = ${input.now}
    FROM candidates
    WHERE request."id" = candidates."id"
    RETURNING
      request."id",
      request."subjectDigest",
      request."userId",
      request."source",
      request."stripeCustomerId",
      request."stripeSubscriptionId",
      request."attempts",
      request."maxAttempts",
      request."leaseToken"
  `)
}

async function markFailure(request: ClaimedDeletionRequest, errorCode: string, now: Date): Promise<ProcessResult> {
  const dead = request.attempts >= request.maxAttempts
  const updated = await prisma.accountDeletionRequest.updateMany({
    where: {
      id: request.id,
      status: 'RUNNING',
      leaseToken: request.leaseToken,
    },
    data: {
      status: dead ? 'DEAD' : 'RETRY_WAIT',
      availableAt: dead ? now : retryAt(request.attempts, now),
      leaseToken: null,
      leaseExpiresAt: null,
      lastErrorCode: errorCode,
    },
  })
  return updated.count === 1 ? (dead ? 'dead' : 'retry') : 'lease_lost'
}

async function completeLocalDeletion(request: ClaimedDeletionRequest, now: Date) {
  return prisma.$transaction<LocalDeletionResult>(async (tx) => {
    // Billing writes, lifecycle intake, and final purge share this lock. Re-read
    // both persisted snapshots under it so a newly-bound Stripe customer is
    // always deleted on a later attempt before local data is removed.
    await lockDeletionSubject(tx, request.subjectDigest)
    const currentRequest = await tx.accountDeletionRequest.findUnique({
      where: { id: request.id },
      select: {
        id: true,
        userId: true,
        status: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        attempts: true,
        leaseToken: true,
      },
    })
    if (!currentRequest
      || currentRequest.status !== 'RUNNING'
      || currentRequest.leaseToken !== request.leaseToken) {
      throw new AccountDeletionLeaseLostError()
    }

    const billingBinding = currentRequest.userId
      ? await tx.billingSubscription.findUnique({
        where: { userId: currentRequest.userId },
        select: { stripeCustomerId: true, stripeSubscriptionId: true },
      })
      : null
    const currentCustomerId = billingBinding?.stripeCustomerId ?? currentRequest.stripeCustomerId
    const currentSubscriptionId = billingBinding?.stripeSubscriptionId ?? currentRequest.stripeSubscriptionId
    const bindingChanged = currentRequest.userId !== request.userId
      || currentRequest.stripeCustomerId !== request.stripeCustomerId
      || currentCustomerId !== request.stripeCustomerId
    if (bindingChanged) {
      // The claimed attempt successfully handled its original snapshot. Give
      // the replacement binding the same bounded attempt instead of stranding
      // a RETRY_WAIT row at maxAttempts.
      const retried = await tx.accountDeletionRequest.updateMany({
        where: {
          id: request.id,
          status: 'RUNNING',
          leaseToken: request.leaseToken,
          leaseExpiresAt: { gt: now },
        },
        data: {
          userId: currentRequest.userId,
          stripeCustomerId: currentCustomerId,
          stripeSubscriptionId: currentSubscriptionId,
          status: 'RETRY_WAIT',
          attempts: { decrement: 1 },
          availableAt: retryAt(currentRequest.attempts, now),
          leaseToken: null,
          leaseExpiresAt: null,
          lastErrorCode: 'BILLING_BINDING_CHANGED',
        },
      })
      if (retried.count !== 1) throw new AccountDeletionLeaseLostError()
      return 'billing_binding_changed'
    }

    // This update both verifies the fence and locks the request row until commit.
    const fenced = await tx.accountDeletionRequest.updateMany({
      where: {
        id: request.id,
        status: 'RUNNING',
        leaseToken: request.leaseToken,
        leaseExpiresAt: { gt: now },
      },
      data: { leaseExpiresAt: new Date(now.getTime() + LEASE_MS) },
    })
    if (fenced.count !== 1) throw new AccountDeletionLeaseLostError()

    const userId = request.userId
    const counts = userId
      ? await Promise.all([
        tx.user.count({ where: { id: userId } }),
        tx.trackedKeyword.count({ where: { userId } }),
        tx.lead.count({ where: { userId } }),
        tx.post.count({ where: { userId } }),
        tx.checkoutIntent.count({ where: { userId } }),
        tx.creditLedgerEntry.count({ where: { userId } }),
        tx.billingSubscription.count({ where: { userId } }),
        tx.durableJob.count({ where: { userId } }),
        tx.scanRun.count({ where: { userId } }),
        tx.crmExportDelivery.count({ where: { userId } }),
      ])
      : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    if (userId) await tx.user.deleteMany({ where: { id: userId } })

    await tx.accountDeletionAudit.create({
      data: {
        requestId: request.id,
        subjectDigest: request.subjectDigest,
        stripeCustomerDigest: request.stripeCustomerId
          ? stripeCustomerDigestForId(request.stripeCustomerId)
          : null,
        source: request.source,
        resultCode: counts[0] === 1 ? 'PURGED' : 'NO_LOCAL_USER',
        userRowsDeleted: counts[0],
        keywordRowsDeleted: counts[1],
        leadRowsDeleted: counts[2],
        postRowsDeleted: counts[3],
        checkoutRowsDeleted: counts[4],
        ledgerRowsDeleted: counts[5],
        billingRowsDeleted: counts[6],
        durableJobRowsDeleted: counts[7],
        scanRunRowsDeleted: counts[8],
        crmDeliveryRowsDeleted: counts[9],
        completedAt: now,
      },
    })

    const completed = await tx.accountDeletionRequest.updateMany({
      where: {
        id: request.id,
        status: 'RUNNING',
        leaseToken: request.leaseToken,
      },
      data: {
        userId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        status: 'COMPLETED',
        leaseToken: null,
        leaseExpiresAt: null,
        lastErrorCode: null,
        completedAt: now,
      },
    })
    if (completed.count !== 1) throw new AccountDeletionLeaseLostError()
    return 'completed'
  })
}

async function processRequest(
  request: ClaimedDeletionRequest,
  input: { stripe?: DeletionStripeClient; now: Date },
): Promise<ProcessResult> {
  if (request.stripeCustomerId) {
    let stripe: DeletionStripeClient
    try {
      stripe = input.stripe ?? configuredStripeClient()
    } catch {
      return markFailure(request, 'STRIPE_CONFIGURATION', input.now)
    }

    try {
      await stripe.customers.del(request.stripeCustomerId)
    } catch (error) {
      if (!isStripeResourceMissing(error)) {
        return markFailure(request, stableStripeErrorCode(error), input.now)
      }
    }
  }

  try {
    const result = await completeLocalDeletion(request, input.now)
    return result === 'billing_binding_changed' ? 'retry' : 'completed'
  } catch (error) {
    if (error instanceof AccountDeletionLeaseLostError) return 'lease_lost'
    return markFailure(request, 'LOCAL_PURGE_FAILED', input.now)
  }
}

export class AccountDeletionWorker {
  static async processBatch(input: {
    limit?: number
    stripe?: DeletionStripeClient
    now?: Date
    leaseToken?: string
  } = {}) {
    assertAccountDeletionConfigurationReady()
    requireDeletionAuditSecret()
    const now = input.now ?? new Date()
    const leaseToken = input.leaseToken ?? randomUUID()
    const requests = await claimRequests({ limit: input.limit, now, leaseToken })
    // Keep destructive provider calls and purge transactions bounded. Parallel
    // batches can exhaust serverless DB connections and Stripe rate limits.
    const results: ProcessResult[] = []
    for (const request of requests) {
      results.push(await processRequest(request, { stripe: input.stripe, now }))
    }

    return {
      claimed: requests.length,
      completed: results.filter((result) => result === 'completed').length,
      retried: results.filter((result) => result === 'retry').length,
      dead: results.filter((result) => result === 'dead').length,
      leaseLost: results.filter((result) => result === 'lease_lost').length,
    }
  }
}

export const ACCOUNT_DELETION_WORKER_TESTING = {
  claimRequests,
  completeLocalDeletion,
  isStripeResourceMissing,
  markFailure,
  processRequest,
  retryAt,
  stableStripeErrorCode,
}
