import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import prisma from '@/lib/prisma'
import { AccountDeletionService } from './AccountDeletionService'
import {
  deletionBlocksBilling,
  withUserDeletionLock,
} from './DeletionBillingBarrier'
import { subjectDigestForUserId } from '@/src/modules/lifecycle/domain/accountDeletion'

const integrationEnabled = process.env.PHASE45_INTEGRATION_TEST === 'true'
const runId = randomUUID()
const userIds: string[] = []
const eventIds: string[] = []

async function fixtureUser(label: string) {
  const id = `deletion-billing-${label}-${runId}`
  userIds.push(id)
  await prisma.user.create({
    data: {
      id,
      email: `${id}@integration.test`,
      name: 'Deletion Billing Race Fixture',
    },
  })
  return id
}

describe.skipIf(!integrationEnabled)('deletion and billing PostgreSQL serialization', () => {
  beforeAll(() => {
    vi.stubEnv('DELETION_AUDIT_SECRET', `integration-secret-${runId}`)
  })

  afterAll(async () => {
    await prisma.clerkWebhookEvent.deleteMany({ where: { eventId: { in: eventIds } } })
    await prisma.accountDeletionRequest.deleteMany({
      where: { subjectDigest: { in: userIds.map(subjectDigestForUserId) } },
    })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    vi.unstubAllEnvs()
    await prisma.$disconnect()
  })

  it('makes deletion intake wait for a committed customer and then snapshots it', async () => {
    const id = await fixtureUser('billing-wins')
    const customerId = `cus_${runId}`
    const eventId = `clerk_${runId}`
    eventIds.push(eventId)

    let releaseBilling!: () => void
    const holdBilling = new Promise<void>((resolve) => { releaseBilling = resolve })
    let billingLocked!: () => void
    const acquired = new Promise<void>((resolve) => { billingLocked = resolve })

    const billingWrite = withUserDeletionLock(id, async (tx, state) => {
      expect(deletionBlocksBilling(state)).toBe(false)
      billingLocked()
      await holdBilling
      await tx.billingSubscription.create({
        data: {
          userId: id,
          stripeCustomerId: customerId,
          plan: 'FREE',
          status: 'inactive',
        },
      })
    })
    await acquired

    let intakeSettled = false
    const intake = AccountDeletionService.acceptClerkUserDeleted({
      eventId,
      eventType: 'user.deleted',
      clerkUserId: id,
    }).finally(() => { intakeSettled = true })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(intakeSettled).toBe(false)
    releaseBilling()
    await Promise.all([billingWrite, intake])

    await expect(prisma.accountDeletionRequest.findUniqueOrThrow({
      where: { subjectDigest: subjectDigestForUserId(id) },
      select: { stripeCustomerId: true, status: true },
    })).resolves.toEqual({ stripeCustomerId: customerId, status: 'PENDING' })
  })

  it('makes a committed deletion freeze reject the billing mutation path', async () => {
    const id = await fixtureUser('deletion-wins')
    await AccountDeletionService.prepareSelfServiceDeletion(id)

    const result = await withUserDeletionLock(id, async (_tx, state) => ({
      blocked: deletionBlocksBilling(state),
    }))

    expect(result).toEqual({ blocked: true })
    await expect(prisma.billingSubscription.count({ where: { userId: id } })).resolves.toBe(0)
  })

  it('blocks identity deletion while an already-issued Checkout can still complete', async () => {
    const id = await fixtureUser('pending-checkout')
    await prisma.checkoutIntent.create({
      data: {
        userId: id,
        kind: 'POTION',
        sku: 'minor_vial',
        expectedAmount: 900,
        stripeCheckoutSessionId: `cs_pending_${runId}`,
        stripeCheckoutUrl: `https://checkout.stripe.test/cs_pending_${runId}`,
      },
    })

    await expect(AccountDeletionService.prepareSelfServiceDeletion(id)).resolves.toEqual({
      prepared: false,
      alreadyAccepted: false,
      pendingCheckout: true,
    })
    await expect(prisma.accountDeletionRequest.findUnique({
      where: { subjectDigest: subjectDigestForUserId(id) },
    })).resolves.toBeNull()
  })
})
