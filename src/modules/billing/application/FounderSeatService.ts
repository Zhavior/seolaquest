import 'server-only'

import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { FOUNDER_SEAT_LIMIT } from '@/src/modules/billing/domain/catalog'
import { NONTERMINAL_SUBSCRIPTION_STATUSES } from '@/src/modules/billing/domain/subscriptionStatus'

/**
 * The Founder Pass price lock is honoured for as long as the subscription stays
 * active, so the seat count is the only thing bounding what that promise costs.
 * This service is where the cap is actually enforced — the counter shown on the
 * billing page is a projection of the same numbers, never a separate tally.
 *
 * A seat is held by one of two things:
 *
 *  - a *claimed* seat: a subscription row on the FOUNDER plan whose Stripe
 *    status has not terminated;
 *  - a *reserved* seat: a FOUNDER checkout intent that is still PENDING and was
 *    last touched inside the reservation window.
 *
 * Reservations expire so an abandoned tab cannot squat a seat forever, and they
 * exist at all so two hunters cannot both be sold seat 50 in the gap between
 * opening Checkout and the webhook that activates it.
 */

/**
 * How long an opened Checkout Session holds its seat. Stripe's own Sessions
 * expire after 24 hours, but a hunter who has not paid within half an hour has
 * left, and a seat held that long would read as sold out while it is not.
 */
const RESERVATION_WINDOW_MS = 30 * 60_000

/**
 * A single lock key for the whole seat pool. Every seat decision serializes on
 * it, which is what makes "count, then decide" safe under concurrency.
 */
const SEAT_LOCK_KEY = 'founder-seats'

export type FounderSeatSnapshot = {
  limit: number
  claimed: number
  reserved: number
  remaining: number
  soldOut: boolean
}

type SeatCountClient = Pick<Prisma.TransactionClient, 'billingSubscription' | 'checkoutIntent'>

function reservationCutoff(now: Date) {
  return new Date(now.getTime() - RESERVATION_WINDOW_MS)
}

async function claimedSeats(db: SeatCountClient) {
  return db.billingSubscription.count({
    where: {
      plan: 'FOUNDER',
      status: { in: [...NONTERMINAL_SUBSCRIPTION_STATUSES] },
    },
  })
}

/**
 * `excludeUserId` keeps a hunter's own open Checkout from counting against
 * them. Without it, reopening the billing page would report one fewer seat than
 * they can actually buy, and the last seat could never be sold at all.
 */
async function reservedSeats(db: SeatCountClient, now: Date, excludeUserId?: string) {
  return db.checkoutIntent.count({
    where: {
      kind: 'SUBSCRIPTION',
      sku: 'FOUNDER',
      status: 'PENDING',
      // `updatedAt`, not `createdAt`: an intent is reused across attempts, and
      // `touchReservation` re-stamps it each time the hunter passes the seat
      // check. Counting the creation time would let a long-lived reused intent
      // fall out of the window while its Checkout Session was still payable,
      // and its seat could then be sold twice.
      updatedAt: { gt: reservationCutoff(now) },
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
  })
}

export class FounderSeatService {
  static readonly limit = FOUNDER_SEAT_LIMIT

  /**
   * Read-only projection for the UI. Deliberately does not take the seat lock:
   * a page render must not serialize behind checkouts, and a counter that is a
   * few seconds stale is harmless. Checkout itself re-counts under the lock.
   */
  static async snapshot(
    db: SeatCountClient = prisma,
    now = new Date(),
  ): Promise<FounderSeatSnapshot> {
    const [claimed, reserved] = await Promise.all([
      claimedSeats(db),
      reservedSeats(db, now),
    ])

    const taken = claimed + reserved
    return {
      limit: FOUNDER_SEAT_LIMIT,
      claimed,
      reserved,
      remaining: Math.max(0, FOUNDER_SEAT_LIMIT - taken),
      soldOut: taken >= FOUNDER_SEAT_LIMIT,
    }
  }

  /**
   * Serializes the caller against every other seat decision for the rest of the
   * enclosing transaction. Must be called before `hasSeatAvailable`, or two
   * concurrent checkouts can both read the same free seat and both sell it.
   *
   * `$executeRaw`, never `$queryRaw`: pg_advisory_xact_lock() returns void, and
   * $queryRaw fails trying to deserialize that column.
   */
  static async lockSeatPool(tx: Prisma.TransactionClient) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${SEAT_LOCK_KEY}, 0))`
  }

  /**
   * Whether one more seat can be sold. Call only inside a transaction that has
   * already taken `lockSeatPool`.
   */
  static async hasSeatAvailable(
    tx: Prisma.TransactionClient,
    forUserId: string,
    now = new Date(),
  ) {
    const [claimed, reserved] = await Promise.all([
      claimedSeats(tx),
      reservedSeats(tx, now, forUserId),
    ])
    return claimed + reserved < FOUNDER_SEAT_LIMIT
  }

  /**
   * Re-stamps a reused intent so its seat stays reserved for another window.
   * Writing the status it already holds is a deliberate no-op whose only effect
   * is bumping `updatedAt`, which is what `reservedSeats` counts.
   */
  static async touchReservation(tx: Prisma.TransactionClient, intentId: string) {
    await tx.checkoutIntent.update({
      where: { id: intentId },
      data: { status: 'PENDING' },
    })
  }
}
