import 'server-only'

import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { subjectDigestForUserId } from '@/src/modules/lifecycle/domain/accountDeletion'

const SUBJECT_TRANSACTION_OPTIONS = {
  maxWait: 5_000,
  timeout: 30_000,
} as const

export type DeletionSubjectTransaction = Prisma.TransactionClient

export type DeletionSubjectState = {
  subjectDigest: string
  request: {
    id: string
    status: string
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
  } | null
  audit: { id: string } | null
}

export async function lockDeletionSubject(
  tx: Pick<Prisma.TransactionClient, '$executeRaw'>,
  subjectDigest: string,
) {
  await tx.$executeRaw(Prisma.sql`
    SELECT pg_advisory_xact_lock(hashtextextended(${subjectDigest}, 0))
  `)
}

export async function readDeletionSubjectState(
  tx: Pick<Prisma.TransactionClient, 'accountDeletionRequest' | 'accountDeletionAudit'>,
  subjectDigest: string,
): Promise<DeletionSubjectState> {
  const [request, audit] = await Promise.all([
    tx.accountDeletionRequest.findUnique({
      where: { subjectDigest },
      select: {
        id: true,
        status: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    }),
    tx.accountDeletionAudit.findUnique({
      where: { subjectDigest },
      select: { id: true },
    }),
  ])

  return { subjectDigest, request, audit }
}

export function deletionBlocksBilling(state: DeletionSubjectState) {
  return Boolean(state.request || state.audit)
}

export async function withUserDeletionLock<T>(
  userId: string,
  work: (tx: DeletionSubjectTransaction, state: DeletionSubjectState) => Promise<T>,
) {
  const subjectDigest = subjectDigestForUserId(userId)
  return withDeletionSubjectLock(subjectDigest, work)
}

export async function withDeletionSubjectLock<T>(
  subjectDigest: string,
  work: (tx: DeletionSubjectTransaction, state: DeletionSubjectState) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    await lockDeletionSubject(tx, subjectDigest)
    const state = await readDeletionSubjectState(tx, subjectDigest)
    return work(tx, state)
  }, SUBJECT_TRANSACTION_OPTIONS)
}

export const DELETION_BARRIER_TESTING = {
  SUBJECT_TRANSACTION_OPTIONS,
}
