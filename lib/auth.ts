import 'server-only'

import { Prisma, type OnboardingSource, type User } from '@prisma/client'
import { currentUser, auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { subjectDigestForUserId } from '@/src/modules/lifecycle/domain/accountDeletion'

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function isMissingColumn(error: unknown, columnNames: string[]) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2022' &&
    typeof error.meta?.column === 'string' &&
    columnNames.some(
      (columnName) =>
        error.meta?.column === columnName || String(error.meta?.column).endsWith(`.${columnName}`),
    )
  )
}

function isMissingOnboardingColumn(error: unknown) {
  return isMissingColumn(error, ['onboardingStep', 'onboardingComplete'])
}

type CompatibleUserRow = {
  id: string
  email: string
  name: string | null
  title: string | null
  businessDescription: string | null
  targetCustomer: string | null
  firstKeyword: string | null
  preferredSource: string | null
  emailDigest: boolean | null
  radarAlerts: boolean | null
  crmWebhookUrl: string | null
  questsRemaining: number | null
  spellsCast: number | null
  questsExported: number | null
  maxCredits: number | null
  xpMultiplier: number | null
  level: number | null
  xp: number | null
  xpRequired: number | null
  unlockedTheme: string | null
  createdAt: Date
  updatedAt: Date
}

function normalizePreferredSource(value: string | null): OnboardingSource | null {
  return value === 'REDDIT' || value === 'X' ? value : null
}

function toCompatibleUser(row: CompatibleUserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    title: row.title,
    onboardingComplete: false,
    onboardingStep: 1,
    businessDescription: row.businessDescription,
    targetCustomer: row.targetCustomer,
    firstKeyword: row.firstKeyword,
    preferredSource: normalizePreferredSource(row.preferredSource),
    emailDigest: row.emailDigest ?? true,
    radarAlerts: row.radarAlerts ?? true,
    crmWebhookUrl: row.crmWebhookUrl,
    questsRemaining: row.questsRemaining ?? 0,
    spellsCast: row.spellsCast ?? 0,
    questsExported: row.questsExported ?? 0,
    maxCredits: row.maxCredits ?? 0,
    xpMultiplier: row.xpMultiplier ?? 1,
    level: row.level ?? 1,
    xp: row.xp ?? 0,
    xpRequired: row.xpRequired ?? 100,
    unlockedTheme: row.unlockedTheme ?? 'PARCHMENT_WOOD',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function findUserWithOnboardingFallback(userId: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({ where: { id: userId } })
  } catch (error) {
    if (!isMissingOnboardingColumn(error)) throw error

    const rows = await prisma.$queryRaw<CompatibleUserRow[]>`
      SELECT
        "id",
        "email",
        "name",
        "title",
        "businessDescription",
        "targetCustomer",
        "firstKeyword",
        "preferredSource"::text as "preferredSource",
        "emailDigest",
        "radarAlerts",
        "crmWebhookUrl",
        "questsRemaining",
        "spellsCast",
        "questsExported",
        "maxCredits",
        "xpMultiplier",
        "level",
        "xp",
        "xpRequired",
        "unlockedTheme",
        "createdAt",
        "updatedAt"
      FROM "User"
      WHERE "id" = ${userId}
      LIMIT 1
    `

    const row = rows[0]
    return row ? toCompatibleUser(row) : null
  }
}

async function reconcileVerifiedEmailUser(db: Prisma.TransactionClient, userId: string, email: string) {
  const emailUser = await db.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })
  if (!emailUser) return null
  if (emailUser.id === userId) return emailUser

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

  const existingUser = await findUserWithOnboardingFallback(userId)
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
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${subjectDigest}, 0))`
        const [request, audit] = await Promise.all([
          tx.accountDeletionRequest.findUnique({ where: { subjectDigest }, select: { id: true } }),
          tx.accountDeletionAudit.findUnique({ where: { subjectDigest }, select: { id: true } }),
        ])
        if (request || audit) return null
      }

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

    const concurrentUser = await findUserWithOnboardingFallback(userId)
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
