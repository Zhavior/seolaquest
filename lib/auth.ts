import 'server-only'

import { Prisma } from '@prisma/client'
import { currentUser, auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { subjectDigestForUserId } from '@/src/modules/lifecycle/domain/accountDeletion'

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

async function reconcileVerifiedEmailUser(db: Prisma.TransactionClient, userId: string, email: string) {
  const emailUser = await db.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })
  if (!emailUser) return null
  if (emailUser.id === userId) return emailUser

  // The legacy signup wrote an unrelated UUID. Production FKs use ON UPDATE CASCADE,
  // so moving the verified owner to the Clerk ID retains their existing rows.
  // Let unique violations abort the transaction; querying again inside an aborted
  // PostgreSQL transaction would mask the original race with a second error.
  return db.user.update({
    where: { email: emailUser.email },
    data: { id: userId },
  })
}

function deletionDigest(userId: string, requireConfigured = false) {
  const configured = process.env.DELETION_AUDIT_SECRET?.trim()
  if (!configured) {
    if (requireConfigured && process.env.NODE_ENV === 'production') {
      throw new Error('Account lifecycle protection is not configured')
    }
    return null
  }
  return subjectDigestForUserId(userId)
}

async function deletionStateExists(userId: string, requireConfigured = false) {
  const subjectDigest = deletionDigest(userId, requireConfigured)
  if (!subjectDigest) return false
  const [request, audit] = await Promise.all([
    prisma.accountDeletionRequest.findUnique({ where: { subjectDigest }, select: { id: true } }),
    prisma.accountDeletionAudit.findUnique({ where: { subjectDigest }, select: { id: true } }),
  ])
  return Boolean(request || audit)
}

export async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId } })
  if (existingUser) {
    if (await deletionStateExists(userId)) return null
    return existingUser
  }

  const clerkUser = await currentUser()
  if (!clerkUser || clerkUser.id !== userId || !clerkUser.primaryEmailAddressId) {
    return null
  }

  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId,
  )
  if (!primaryEmail || primaryEmail.verification?.status !== 'verified') {
    return null
  }

  const email = primaryEmail.emailAddress.trim().toLowerCase()
  try {
    return await prisma.$transaction(async (tx) => {
      const subjectDigest = deletionDigest(userId, true)
      if (subjectDigest) {
        // Intake takes the same transaction-scoped lock. Whichever side wins,
        // provisioning cannot commit after a deletion request was accepted.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${subjectDigest}, 0))`
        const [request, audit] = await Promise.all([
          tx.accountDeletionRequest.findUnique({ where: { subjectDigest }, select: { id: true } }),
          tx.accountDeletionAudit.findUnique({ where: { subjectDigest }, select: { id: true } }),
        ])
        if (request || audit) return null
      }

      // Serialize legacy email reconciliation as well as provider-ID creation.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'email:' + email}, 0))`
      const concurrentUser = await tx.user.findUnique({ where: { id: userId } })
      if (concurrentUser) return concurrentUser

      const legacyUser = await reconcileVerifiedEmailUser(tx, userId, email)
      if (legacyUser) return legacyUser

      return tx.user.create({
        data: {
          id: userId,
          email,
          name: clerkUser.fullName || clerkUser.firstName || 'Hunter',
        },
      })
    })
  } catch (error) {
    if (!isUniqueConflict(error)) throw error

    const concurrentUser = await prisma.user.findUnique({ where: { id: userId } })
    if (concurrentUser && !(await deletionStateExists(userId))) return concurrentUser
    throw error
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
