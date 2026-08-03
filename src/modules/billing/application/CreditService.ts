import 'server-only'

import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'

type CreditGrantInput = {
  userId: string
  credits: number
  sourceType: 'STRIPE_INVOICE'
  sourceId: string
  reason: 'PLAN_PERIOD_ALLOCATION'
}

export class CreditService {
  /** The ledger source is the economic idempotency boundary. */
  static async grantInvoiceAllocation(input: CreditGrantInput, transaction?: Prisma.TransactionClient) {
    if (!Number.isSafeInteger(input.credits) || input.credits <= 0) {
      throw new Error('Credit allocation must be a positive integer')
    }

    const grant = async (tx: Prisma.TransactionClient) => {
      const inserted = await tx.creditLedgerEntry.createMany({
        data: [{
          userId: input.userId,
          delta: input.credits,
          reason: input.reason,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
        }],
        skipDuplicates: true,
      })

      if (inserted.count === 0) {
        const existing = await tx.creditLedgerEntry.findUnique({
          where: {
            sourceType_sourceId: {
              sourceType: input.sourceType,
              sourceId: input.sourceId,
            },
          },
        })
        if (!existing || existing.userId !== input.userId || existing.delta !== input.credits) {
          throw new Error('Credit ledger source conflicts with the expected allocation')
        }
        return { granted: false }
      }

      const updated = await tx.user.update({
        where: { id: input.userId },
        data: { questsRemaining: { increment: input.credits } },
        select: { questsRemaining: true },
      })

      // Capacity is a watermark. It only moves up, preserving potion and
      // legacy balances instead of replacing them with the monthly allowance.
      await tx.user.updateMany({
        where: { id: input.userId, maxCredits: { lt: updated.questsRemaining } },
        data: { maxCredits: updated.questsRemaining },
      })

      return { granted: true }
    }
    return transaction ? grant(transaction) : prisma.$transaction(grant)
  }
}
