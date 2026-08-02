import { randomUUID } from 'node:crypto'
import type Stripe from 'stripe'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import prisma from '@/lib/prisma'
import { CreditService } from './CreditService'
import { WebhookService } from './WebhookService'

const integrationEnabled = process.env.BILLING_INTEGRATION_TEST === 'true'
const runId = randomUUID()
const userId = `billing-integration-${runId}`
const invoiceId = `in-integration-${runId}`
const renewalInvoiceId = `in-renewal-${runId}`
const rollbackSourceId = `in-rollback-${runId}`
const callerRollbackSourceId = `in-caller-rollback-${runId}`
const checkoutIntentId = `ci-integration-${runId}`
const checkoutSessionId = `cs-integration-${runId}`
const webhookEventId = `evt-integration-${runId}`

async function waitForWebhookInboxRow() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const row = await prisma.stripeWebhookEvent.findUnique({ where: { eventId: webhookEventId } })
    if (row) return row
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('Timed out waiting for the webhook inbox row')
}

describe.skipIf(!integrationEnabled)('real PostgreSQL billing credit invariants', () => {
  beforeAll(async () => {
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_billing_integration')
    vi.stubEnv('DELETION_AUDIT_SECRET', `billing-integration-secret-${runId}`)
    await prisma.user.create({
      data: {
        id: userId,
        email: `${runId}@billing-integration.test`,
        name: 'Billing Integration Test',
      },
    })
  })

  afterAll(async () => {
    vi.unstubAllEnvs()
    await prisma.stripeWebhookEvent.deleteMany({ where: { eventId: webhookEventId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  const deliverInvoice = (eventDeliveryId: string, sourceId: string) => {
    void eventDeliveryId
    return CreditService.grantInvoiceAllocation({
      userId,
      credits: 50,
      sourceType: 'STRIPE_INVOICE',
      sourceId,
      reason: 'PLAN_PERIOD_ALLOCATION',
    })
  }

  it('serializes duplicate invoice deliveries and grants each distinct renewal once', async () => {
    const duplicateResults = await Promise.all([
      deliverInvoice(`evt-a-${runId}`, invoiceId),
      deliverInvoice(`evt-b-${runId}`, invoiceId),
    ])

    expect(duplicateResults).toEqual(expect.arrayContaining([
      { granted: true },
      { granted: false },
    ]))
    expect(await prisma.creditLedgerEntry.count({
      where: { userId, sourceType: 'STRIPE_INVOICE', sourceId: invoiceId },
    })).toBe(1)
    await expect(prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { questsRemaining: true, maxCredits: true },
    })).resolves.toEqual({ questsRemaining: 50, maxCredits: 50 })

    await expect(deliverInvoice(`evt-renewal-${runId}`, renewalInvoiceId)).resolves.toEqual({
      granted: true,
    })
    expect(await prisma.creditLedgerEntry.count({
      where: { userId, sourceType: 'STRIPE_INVOICE' },
    })).toBe(2)
    await expect(prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { questsRemaining: true, maxCredits: true },
    })).resolves.toEqual({ questsRemaining: 100, maxCredits: 100 })
  })

  it('rolls back both the ledger and balance when a transaction fails after both writes', async () => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { questsRemaining: true },
    })

    await expect(prisma.$transaction(async (tx) => {
      await tx.creditLedgerEntry.create({
        data: {
          userId,
          delta: 50,
          reason: 'PLAN_PERIOD_ALLOCATION',
          sourceType: 'STRIPE_INVOICE',
          sourceId: rollbackSourceId,
        },
      })
      await tx.user.update({
        where: { id: userId },
        data: { questsRemaining: { increment: 50 } },
      })
      throw new Error('forced integration rollback')
    })).rejects.toThrow('forced integration rollback')

    await expect(prisma.creditLedgerEntry.findUnique({
      where: {
        sourceType_sourceId: {
          sourceType: 'STRIPE_INVOICE',
          sourceId: rollbackSourceId,
        },
      },
    })).resolves.toBeNull()
    await expect(prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { questsRemaining: true },
    })).resolves.toEqual(before)
  })

  it('reuses a caller transaction so the allocation rolls back with its caller', async () => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { questsRemaining: true, maxCredits: true },
    })

    await expect(prisma.$transaction(async (tx) => {
      await expect(CreditService.grantInvoiceAllocation({
        userId,
        credits: 50,
        sourceType: 'STRIPE_INVOICE',
        sourceId: callerRollbackSourceId,
        reason: 'PLAN_PERIOD_ALLOCATION',
      }, tx)).resolves.toEqual({ granted: true })
      await expect(tx.creditLedgerEntry.count({
        where: { sourceType: 'STRIPE_INVOICE', sourceId: callerRollbackSourceId },
      })).resolves.toBe(1)
      throw new Error('forced caller transaction rollback')
    })).rejects.toThrow('forced caller transaction rollback')

    await expect(prisma.creditLedgerEntry.findUnique({
      where: {
        sourceType_sourceId: {
          sourceType: 'STRIPE_INVOICE',
          sourceId: callerRollbackSourceId,
        },
      },
    })).resolves.toBeNull()
    await expect(prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { questsRemaining: true, maxCredits: true },
    })).resolves.toEqual(before)
  })

  it('fences concurrent webhook deliveries and recognizes the eventual replay as duplicate', async () => {
    await prisma.checkoutIntent.create({
      data: {
        id: checkoutIntentId,
        userId,
        kind: 'POTION',
        sku: 'minor_vial',
        status: 'PENDING',
        stripeCheckoutSessionId: checkoutSessionId,
      },
    })
    const event = {
      id: webhookEventId,
      type: 'checkout.session.expired',
      livemode: false,
      created: Math.floor(Date.now() / 1000),
      data: { object: { id: checkoutSessionId } },
    } as Stripe.Event
    const stripe = {} as Stripe
    let firstDelivery: ReturnType<typeof WebhookService.process> | undefined

    const secondResult = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "CheckoutIntent" WHERE "id" = ${checkoutIntentId} FOR UPDATE`
      firstDelivery = WebhookService.process(stripe, event)
      await waitForWebhookInboxRow()
      return WebhookService.process(stripe, event)
    })

    expect(secondResult).toEqual({ recognized: true, duplicate: false, inProgress: true })
    await expect(firstDelivery).resolves.toEqual({
      recognized: true,
      duplicate: false,
      inProgress: false,
    })
    await expect(WebhookService.process(stripe, event)).resolves.toEqual({
      recognized: true,
      duplicate: true,
      inProgress: false,
    })
    await expect(prisma.stripeWebhookEvent.findMany({
      where: { eventId: webhookEventId },
      select: { status: true, attempts: true },
    })).resolves.toEqual([{ status: 'PROCESSED', attempts: 1 }])
  })
})
