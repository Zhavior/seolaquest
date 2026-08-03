import 'server-only'

import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { deletionSubjectDigest } from '@/src/modules/lifecycle/domain/accountDeletion'
import {
  lockDeletionSubject,
  readDeletionSubjectState,
  withUserDeletionLock,
} from '@/src/modules/lifecycle/application/DeletionBillingBarrier'

export type ClerkDeletionIntake = {
  eventId: string
  eventType: 'user.deleted'
  clerkUserId: string
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export class AccountDeletionService {
  static async prepareSelfServiceDeletion(clerkUserId: string) {
    return withUserDeletionLock(clerkUserId, async (tx, state) => {
      if (state.audit || (state.request && state.request.status !== 'AWAITING_IDENTITY_DELETE')) {
        return { prepared: false, alreadyAccepted: true }
      }

      // A hosted Stripe Checkout URL remains usable after it is issued. Do not
      // delete the identity while a one-time payment or subscription Checkout
      // can still complete and race the deletion tombstone.
      const pendingCheckoutCount = await tx.checkoutIntent.count({
        where: { userId: clerkUserId, status: 'PENDING' },
      })
      if (pendingCheckoutCount > 0) {
        return { prepared: false, alreadyAccepted: false, pendingCheckout: true }
      }

      const user = await tx.user.findUnique({
        where: { id: clerkUserId },
        select: {
          id: true,
          billingSubscription: {
            select: {
              stripeCustomerId: true,
              stripeSubscriptionId: true,
            },
          },
        },
      })
      const snapshot = {
        userId: user?.id ?? null,
        stripeCustomerId: user?.billingSubscription?.stripeCustomerId ?? null,
        stripeSubscriptionId: user?.billingSubscription?.stripeSubscriptionId ?? null,
      }

      if (state.request) {
        await tx.accountDeletionRequest.update({
          where: { id: state.request.id },
          data: snapshot,
        })
      } else {
        await tx.accountDeletionRequest.create({
          data: {
            subjectDigest: state.subjectDigest,
            source: 'SELF_SERVICE',
            status: 'AWAITING_IDENTITY_DELETE',
            ...snapshot,
          },
        })
      }

      return { prepared: true, alreadyAccepted: false }
    })
  }

  static async promoteSelfServiceDeletion(clerkUserId: string) {
    return withUserDeletionLock(clerkUserId, async (tx, state) => {
      if (state.audit) return { promoted: false, alreadyAccepted: true }
      if (!state.request) throw new Error('Prepared account deletion is missing')
      if (state.request.status !== 'AWAITING_IDENTITY_DELETE') {
        return { promoted: false, alreadyAccepted: true }
      }

      const promoted = await tx.accountDeletionRequest.updateMany({
        where: {
          id: state.request.id,
          source: 'SELF_SERVICE',
          status: 'AWAITING_IDENTITY_DELETE',
        },
        data: { status: 'PENDING', availableAt: new Date(), lastErrorCode: null },
      })
      if (promoted.count !== 1) throw new Error('Prepared account deletion changed before promotion')
      return { promoted: true, alreadyAccepted: false }
    })
  }

  static async acceptClerkUserDeleted(input: ClerkDeletionIntake) {
    const subjectDigest = deletionSubjectDigest(input.clerkUserId)

    try {
      await prisma.$transaction(async (tx) => {
        // Serialize deletion intake with auth provisioning and billing writes.
        await lockDeletionSubject(tx, subjectDigest)

        await tx.clerkWebhookEvent.create({
          data: {
            eventId: input.eventId,
            eventType: input.eventType,
          },
        })

        const user = await tx.user.findUnique({
          where: { id: input.clerkUserId },
          select: {
            id: true,
            billingSubscription: {
              select: {
                stripeCustomerId: true,
                stripeSubscriptionId: true,
              },
            },
          },
        })

        const state = await readDeletionSubjectState(tx, subjectDigest)
        const snapshot = {
          ...(user ? { userId: user.id } : {}),
          ...(user?.billingSubscription?.stripeCustomerId
            ? { stripeCustomerId: user.billingSubscription.stripeCustomerId }
            : {}),
          ...(user?.billingSubscription?.stripeSubscriptionId
            ? { stripeSubscriptionId: user.billingSubscription.stripeSubscriptionId }
            : {}),
        }

        if (state.request && state.request.status !== 'COMPLETED') {
          await tx.accountDeletionRequest.updateMany({
            where: { id: state.request.id, status: { not: 'COMPLETED' } },
            data: {
              ...snapshot,
              ...(state.request.status === 'AWAITING_IDENTITY_DELETE'
                ? { status: 'PENDING', availableAt: new Date(), lastErrorCode: null }
                : {}),
            },
          })
        } else if (!state.audit) {
          await tx.accountDeletionRequest.create({
            data: {
              subjectDigest,
              userId: user?.id ?? null,
              source: 'CLERK_WEBHOOK',
              status: 'PENDING',
              stripeCustomerId: user?.billingSubscription?.stripeCustomerId ?? null,
              stripeSubscriptionId: user?.billingSubscription?.stripeSubscriptionId ?? null,
            },
          })
        }
      })
      return { duplicate: false }
    } catch (error) {
      if (!isUniqueConflict(error)) throw error

      const existing = await prisma.clerkWebhookEvent.findUnique({
        where: { eventId: input.eventId },
        select: { id: true },
      })
      if (!existing) throw error
      return { duplicate: true }
    }
  }
}
