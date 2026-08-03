import type { AccountDeletionRequest } from '@prisma/client'
import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  txRequestUpdateMany: vi.fn(),
  txExecuteRaw: vi.fn(),
  requestFindUnique: vi.fn(),
  billingFindUnique: vi.fn(),
  auditCreate: vi.fn(),
  userDeleteMany: vi.fn(),
  userCount: vi.fn(),
  keywordCount: vi.fn(),
  leadCount: vi.fn(),
  postCount: vi.fn(),
  checkoutCount: vi.fn(),
  ledgerCount: vi.fn(),
  billingCount: vi.fn(),
  durableJobCount: vi.fn(),
  scanRunCount: vi.fn(),
  crmDeliveryCount: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRaw: mocks.queryRaw,
    $transaction: mocks.transaction,
    accountDeletionRequest: { updateMany: mocks.updateMany },
  },
}))

import {
  ACCOUNT_DELETION_WORKER_TESTING,
  AccountDeletionLeaseLostError,
  AccountDeletionWorker,
} from './AccountDeletionWorker'

function claimed(overrides: Partial<AccountDeletionRequest> = {}) {
  return {
    id: 'delete_1',
    subjectDigest: 'digest_1',
    userId: 'user_1',
    source: 'CLERK_WEBHOOK',
    stripeCustomerId: 'cus_1',
    stripeSubscriptionId: 'sub_1',
    attempts: 1,
    maxAttempts: 8,
    leaseToken: 'lease_1',
    ...overrides,
  } as AccountDeletionRequest
}

function stripeWithDelete(del: ReturnType<typeof vi.fn>) {
  return { customers: { del } } as unknown as Stripe
}

function transactionClient() {
  return {
    $executeRaw: mocks.txExecuteRaw,
    accountDeletionRequest: {
      findUnique: mocks.requestFindUnique,
      updateMany: mocks.txRequestUpdateMany,
    },
    accountDeletionAudit: { create: mocks.auditCreate },
    user: { count: mocks.userCount, deleteMany: mocks.userDeleteMany },
    trackedKeyword: { count: mocks.keywordCount },
    lead: { count: mocks.leadCount },
    post: { count: mocks.postCount },
    checkoutIntent: { count: mocks.checkoutCount },
    creditLedgerEntry: { count: mocks.ledgerCount },
    billingSubscription: { count: mocks.billingCount, findUnique: mocks.billingFindUnique },
    durableJob: { count: mocks.durableJobCount },
    scanRun: { count: mocks.scanRunCount },
    crmExportDelivery: { count: mocks.crmDeliveryCount },
  }
}

describe('AccountDeletionWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'true')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_clerk')
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'whsec_test_clerk')
    vi.stubEnv('DELETION_AUDIT_SECRET', 'worker-test-audit-secret')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_worker')
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    mocks.queryRaw.mockResolvedValue([])
    mocks.updateMany.mockResolvedValue({ count: 1 })
    mocks.transaction.mockImplementation(async (callback) => callback(transactionClient()))
    mocks.txRequestUpdateMany.mockResolvedValue({ count: 1 })
    mocks.txExecuteRaw.mockResolvedValue(1)
    mocks.requestFindUnique.mockResolvedValue({
      id: 'delete_1',
      userId: 'user_1',
      status: 'RUNNING',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
      attempts: 1,
      leaseToken: 'lease_1',
    })
    mocks.billingFindUnique.mockResolvedValue({
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
    })
    mocks.userDeleteMany.mockResolvedValue({ count: 1 })
    mocks.auditCreate.mockResolvedValue({ id: 'audit_1' })
    mocks.userCount.mockResolvedValue(1)
    mocks.keywordCount.mockResolvedValue(2)
    mocks.leadCount.mockResolvedValue(3)
    mocks.postCount.mockResolvedValue(4)
    mocks.checkoutCount.mockResolvedValue(5)
    mocks.ledgerCount.mockResolvedValue(6)
    mocks.billingCount.mockResolvedValue(1)
    mocks.durableJobCount.mockResolvedValue(7)
    mocks.scanRunCount.mockResolvedValue(8)
    mocks.crmDeliveryCount.mockResolvedValue(9)
  })

  it('moves a Stripe failure to retry wait without persisting the external error', async () => {
    const stripeDelete = vi.fn().mockRejectedValue(new Error('raw provider body with PII'))
    mocks.queryRaw.mockResolvedValue([claimed()])

    await expect(AccountDeletionWorker.processBatch({
      stripe: stripeWithDelete(stripeDelete),
      now: new Date('2026-07-30T12:00:00.000Z'),
      leaseToken: 'lease_1',
    })).resolves.toEqual({ claimed: 1, completed: 0, retried: 1, dead: 0, leaseLost: 0 })

    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'delete_1', status: 'RUNNING', leaseToken: 'lease_1' },
      data: expect.objectContaining({
        status: 'RETRY_WAIT',
        lastErrorCode: 'STRIPE_CUSTOMER_DELETE_FAILED',
        leaseToken: null,
      }),
    }))
    expect(JSON.stringify(mocks.updateMany.mock.calls)).not.toContain('raw provider body')
  })

  it('claims no deletion work while the production activation switch is off', async () => {
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'false')

    await expect(AccountDeletionWorker.processBatch()).rejects.toThrow('not configured')
    expect(mocks.queryRaw).not.toHaveBeenCalled()
  })

  it('fails before claiming when the Stripe key mode is not fully configured', async () => {
    vi.stubEnv('STRIPE_LIVEMODE', 'true')

    await expect(AccountDeletionWorker.processBatch()).rejects.toThrow('not configured')
    expect(mocks.queryRaw).not.toHaveBeenCalled()
  })

  it('bounds expired terminal cleanup with a locked candidate set', async () => {
    await AccountDeletionWorker.processBatch({ limit: 25, now: new Date('2026-07-30T12:00:00.000Z') })

    const prismaSql = mocks.queryRaw.mock.calls[0][0]
    const sql = prismaSql.strings.join('?')
    expect(sql).toContain('WITH exhausted_candidates AS')
    expect(sql).toContain('ORDER BY exhausted_request."leaseExpiresAt", exhausted_request."createdAt", exhausted_request."id"')
    expect(sql).toContain('LIMIT ?\n      FOR UPDATE OF exhausted_request SKIP LOCKED')
    expect(sql).toContain('FROM exhausted_candidates')
    expect(prismaSql.values.filter((value: unknown) => value === 25)).toHaveLength(2)
  })

  it('dead-letters the final failed attempt', async () => {
    const result = await ACCOUNT_DELETION_WORKER_TESTING.markFailure(
      claimed({ attempts: 8, maxAttempts: 8 }),
      'LOCAL_PURGE_FAILED',
      new Date('2026-07-30T12:00:00.000Z'),
    )

    expect(result).toBe('dead')
    expect(mocks.updateMany.mock.calls[0][0].data.status).toBe('DEAD')
  })

  it('treats an already missing Stripe customer as terminal cleanup success', async () => {
    const missing = new Stripe.errors.StripeInvalidRequestError({
      type: 'invalid_request_error',
      code: 'resource_missing',
      message: 'No such customer',
    })
    mocks.queryRaw.mockResolvedValue([claimed()])
    const stripeDelete = vi.fn().mockRejectedValue(missing)

    await expect(AccountDeletionWorker.processBatch({
      stripe: stripeWithDelete(stripeDelete),
      now: new Date('2026-07-30T12:00:00.000Z'),
      leaseToken: 'lease_1',
    })).resolves.toEqual({ claimed: 1, completed: 1, retried: 0, dead: 0, leaseLost: 0 })

    expect(mocks.userDeleteMany).toHaveBeenCalledWith({ where: { id: 'user_1' } })
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it('refuses local deletion after losing the lease fence', async () => {
    mocks.txRequestUpdateMany.mockResolvedValue({ count: 0 })

    await expect(ACCOUNT_DELETION_WORKER_TESTING.completeLocalDeletion(
      claimed(),
      new Date('2026-07-30T12:00:00.000Z'),
    )).rejects.toThrow(AccountDeletionLeaseLostError)
    expect(mocks.userDeleteMany).not.toHaveBeenCalled()
    expect(mocks.auditCreate).not.toHaveBeenCalled()
  })

  it('locks the subject before re-reading the request and billing binding', async () => {
    await ACCOUNT_DELETION_WORKER_TESTING.completeLocalDeletion(
      claimed(),
      new Date('2026-07-30T12:00:00.000Z'),
    )

    expect(mocks.txExecuteRaw).toHaveBeenCalledTimes(1)
    const sql = mocks.txExecuteRaw.mock.calls[0][0].strings.join('?')
    expect(sql).toContain('pg_advisory_xact_lock(hashtextextended(?, 0))')
    expect(mocks.txExecuteRaw.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.requestFindUnique.mock.invocationCallOrder[0],
    )
    expect(mocks.requestFindUnique.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.billingFindUnique.mock.invocationCallOrder[0],
    )
  })

  it('retries without purging when the Stripe customer binding changed after claim', async () => {
    mocks.queryRaw.mockResolvedValue([claimed()])
    mocks.requestFindUnique.mockResolvedValue({
      id: 'delete_1',
      userId: 'user_1',
      status: 'RUNNING',
      stripeCustomerId: 'cus_2',
      stripeSubscriptionId: 'sub_2',
      attempts: 1,
      leaseToken: 'lease_1',
    })
    mocks.billingFindUnique.mockResolvedValue({
      stripeCustomerId: 'cus_2',
      stripeSubscriptionId: 'sub_2',
    })
    const stripeDelete = vi.fn().mockResolvedValue({ deleted: true })

    await expect(AccountDeletionWorker.processBatch({
      stripe: stripeWithDelete(stripeDelete),
      now: new Date('2026-07-30T12:00:00.000Z'),
      leaseToken: 'lease_1',
    })).resolves.toEqual({ claimed: 1, completed: 0, retried: 1, dead: 0, leaseLost: 0 })

    expect(stripeDelete).toHaveBeenCalledWith('cus_1')
    expect(mocks.userDeleteMany).not.toHaveBeenCalled()
    expect(mocks.auditCreate).not.toHaveBeenCalled()
    expect(mocks.txRequestUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        stripeCustomerId: 'cus_2',
        stripeSubscriptionId: 'sub_2',
        status: 'RETRY_WAIT',
        attempts: { decrement: 1 },
        lastErrorCode: 'BILLING_BINDING_CHANGED',
      }),
    }))
  })

  it('counts cascaded rows, writes only a digest audit, and scrubs request identifiers', async () => {
    await ACCOUNT_DELETION_WORKER_TESTING.completeLocalDeletion(
      claimed(),
      new Date('2026-07-30T12:00:00.000Z'),
    )

    expect(mocks.userDeleteMany).toHaveBeenCalledWith({ where: { id: 'user_1' } })
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestId: 'delete_1',
        subjectDigest: 'digest_1',
        stripeCustomerDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
        resultCode: 'PURGED',
        userRowsDeleted: 1,
        keywordRowsDeleted: 2,
        leadRowsDeleted: 3,
        postRowsDeleted: 4,
        checkoutRowsDeleted: 5,
        ledgerRowsDeleted: 6,
        billingRowsDeleted: 1,
        durableJobRowsDeleted: 7,
        scanRunRowsDeleted: 8,
        crmDeliveryRowsDeleted: 9,
      }),
    })
    expect(mocks.auditCreate.mock.calls[0][0].data).not.toHaveProperty('userId')
    expect(mocks.txRequestUpdateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        status: 'COMPLETED',
      }),
    }))
  })

  it('reports a lost failure fence instead of overwriting the new owner', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 })

    await expect(ACCOUNT_DELETION_WORKER_TESTING.markFailure(
      claimed(),
      'STRIPE_CONNECTION',
      new Date(),
    )).resolves.toBe('lease_lost')
  })
})
