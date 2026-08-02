import { Prisma } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  webhookCreate: vi.fn(),
  webhookFind: vi.fn(),
  userFind: vi.fn(),
  deletionFind: vi.fn(),
  deletionCreate: vi.fn(),
  deletionUpdate: vi.fn(),
  deletionUpdateMany: vi.fn(),
  checkoutCount: vi.fn(),
  deletionAuditFind: vi.fn(),
  advisoryLock: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: mocks.transaction,
    clerkWebhookEvent: { findUnique: mocks.webhookFind },
  },
}))

import { AccountDeletionService } from './AccountDeletionService'

function duplicateError() {
  return new Prisma.PrismaClientKnownRequestError('duplicate', {
    code: 'P2002',
    clientVersion: Prisma.prismaVersion.client,
  })
}

describe('AccountDeletionService Clerk inbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('DELETION_AUDIT_SECRET', 'test-deletion-audit-secret')
    mocks.transaction.mockImplementation(async (callback) => callback({
      $executeRaw: mocks.advisoryLock,
      clerkWebhookEvent: { create: mocks.webhookCreate },
      user: { findUnique: mocks.userFind },
      accountDeletionRequest: {
        findUnique: mocks.deletionFind,
        create: mocks.deletionCreate,
        update: mocks.deletionUpdate,
        updateMany: mocks.deletionUpdateMany,
      },
      checkoutIntent: { count: mocks.checkoutCount },
      accountDeletionAudit: { findUnique: mocks.deletionAuditFind },
    }))
    mocks.userFind.mockResolvedValue({
      id: 'user_1',
      billingSubscription: {
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: 'sub_1',
      },
    })
    mocks.deletionFind.mockResolvedValue(null)
    mocks.deletionAuditFind.mockResolvedValue(null)
    mocks.deletionCreate.mockResolvedValue({ id: 'delete_1' })
    mocks.deletionUpdate.mockResolvedValue({ id: 'delete_1' })
    mocks.deletionUpdateMany.mockResolvedValue({ count: 1 })
    mocks.checkoutCount.mockResolvedValue(0)
    mocks.advisoryLock.mockResolvedValue(1)
  })

  afterEach(() => vi.unstubAllEnvs())

  it('records the event and snapshots billing links in one transaction', async () => {
    await expect(AccountDeletionService.acceptClerkUserDeleted({
      eventId: 'msg_1',
      eventType: 'user.deleted',
      clerkUserId: 'user_1',
    })).resolves.toEqual({ duplicate: false })

    expect(mocks.webhookCreate).toHaveBeenCalledWith({
      data: { eventId: 'msg_1', eventType: 'user.deleted' },
    })
    expect(mocks.advisoryLock).toHaveBeenCalledOnce()
    const request = mocks.deletionCreate.mock.calls[0][0]
    expect(request.data).toMatchObject({
      userId: 'user_1',
      source: 'CLERK_WEBHOOK',
      status: 'PENDING',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
    })
    expect(request.data.subjectDigest).toHaveLength(64)
    expect(request.data.subjectDigest).not.toBe('user_1')
  })

  it('creates a prepared billing freeze with a committed Stripe snapshot before identity deletion', async () => {
    await expect(AccountDeletionService.prepareSelfServiceDeletion('user_1')).resolves.toEqual({
      prepared: true,
      alreadyAccepted: false,
    })

    expect(mocks.advisoryLock).toHaveBeenCalledOnce()
    expect(mocks.deletionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: 'SELF_SERVICE',
        status: 'AWAITING_IDENTITY_DELETE',
        userId: 'user_1',
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: 'sub_1',
      }),
    })
  })

  it('refuses to freeze and delete identity while any hosted Checkout is pending', async () => {
    mocks.checkoutCount.mockResolvedValue(1)

    await expect(AccountDeletionService.prepareSelfServiceDeletion('user_1')).resolves.toEqual({
      prepared: false,
      alreadyAccepted: false,
      pendingCheckout: true,
    })
    expect(mocks.deletionCreate).not.toHaveBeenCalled()
  })

  it('promotes only the prepared self-service freeze after Clerk accepts deletion', async () => {
    mocks.deletionFind.mockResolvedValue({
      id: 'delete_1',
      status: 'AWAITING_IDENTITY_DELETE',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
    })

    await expect(AccountDeletionService.promoteSelfServiceDeletion('user_1')).resolves.toEqual({
      promoted: true,
      alreadyAccepted: false,
    })
    expect(mocks.deletionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'delete_1',
        source: 'SELF_SERVICE',
        status: 'AWAITING_IDENTITY_DELETE',
      },
      data: expect.objectContaining({ status: 'PENDING', lastErrorCode: null }),
    })
  })

  it('promotes an existing prepared freeze when the signed Clerk event wins the race', async () => {
    mocks.deletionFind.mockResolvedValue({
      id: 'delete_1',
      status: 'AWAITING_IDENTITY_DELETE',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: null,
    })

    await AccountDeletionService.acceptClerkUserDeleted({
      eventId: 'msg_promote',
      eventType: 'user.deleted',
      clerkUserId: 'user_1',
    })

    expect(mocks.deletionUpdateMany).toHaveBeenCalledWith({
      where: { id: 'delete_1', status: { not: 'COMPLETED' } },
      data: expect.objectContaining({ status: 'PENDING', stripeSubscriptionId: 'sub_1' }),
    })
    expect(mocks.deletionCreate).not.toHaveBeenCalled()
  })

  it('acknowledges an already persisted Clerk delivery as a duplicate', async () => {
    mocks.transaction.mockRejectedValue(duplicateError())
    mocks.webhookFind.mockResolvedValue({ id: 'inbox_1' })

    await expect(AccountDeletionService.acceptClerkUserDeleted({
      eventId: 'msg_duplicate',
      eventType: 'user.deleted',
      clerkUserId: 'user_1',
    })).resolves.toEqual({ duplicate: true })
  })

  it('does not misclassify a different unique failure as a duplicate delivery', async () => {
    mocks.transaction.mockRejectedValue(duplicateError())
    mocks.webhookFind.mockResolvedValue(null)

    await expect(AccountDeletionService.acceptClerkUserDeleted({
      eventId: 'msg_failed',
      eventType: 'user.deleted',
      clerkUserId: 'user_1',
    })).rejects.toThrow('duplicate')
  })
})
