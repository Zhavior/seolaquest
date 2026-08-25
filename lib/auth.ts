import 'server-only'

import { cache } from 'react'
import { Prisma, type OnboardingSource, type User } from '@prisma/client'
import { currentUser, auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { accountDeletionEnabled, subjectDigestForUserId } from '@/src/modules/lifecycle/domain/accountDeletion'

// Provisioning is serialized by a per-email advisory lock, so a unique conflict means a
// concurrent request won the race. One extra pass is enough to observe its committed row.
const MAX_PROVISION_ATTEMPTS = 2

type RawCapableClient = Pick<Prisma.TransactionClient, '$queryRaw'>

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
  return isMissingColumn(error, [
    'onboardingStep',
    'onboardingComplete',
    'businessDescription',
    'targetCustomer',
    'firstKeyword',
    'preferredSource',
    'emailDigest',
    'radarAlerts',
    'crmWebhookUrl',
    'questsRemaining',
    'spellsCast',
    'questsExported',
    'maxCredits',
    'xpMultiplier',
    'level',
    'xp',
    'xpRequired',
    'unlockedTheme',
    'profileIconKey',
  ])
}

type CompatibleUserRow = {
  id: string
  email: string
  name: string | null
  profileIconKey: string | null
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
    profileIconKey: row.profileIconKey,
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

const compatibleUserColumns = Prisma.sql`
  "id",
  "email",
  "name",
  "title",
  NULL::text as "profileIconKey",
  NULL::text as "businessDescription",
  NULL::text as "targetCustomer",
  NULL::text as "firstKeyword",
  NULL::text as "preferredSource",
  NULL::boolean as "emailDigest",
  NULL::boolean as "radarAlerts",
  NULL::text as "crmWebhookUrl",
  NULL::integer as "questsRemaining",
  NULL::integer as "spellsCast",
  NULL::integer as "questsExported",
  NULL::integer as "maxCredits",
  NULL::double precision as "xpMultiplier",
  NULL::integer as "level",
  NULL::integer as "xp",
  NULL::integer as "xpRequired",
  NULL::text as "unlockedTheme",
  "createdAt",
  "updatedAt"
`

async function queryCompatibleUser(db: RawCapableClient, where: Prisma.Sql): Promise<User | null> {
  const rows = await db.$queryRaw<CompatibleUserRow[]>(
    Prisma.sql`SELECT ${compatibleUserColumns} FROM "User" WHERE ${where} LIMIT 1`,
  )

  const row = rows?.[0]
  return row ? toCompatibleUser(row) : null
}

export async function findUserWithOnboardingFallback(userId: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({ where: { id: userId } })
  } catch (error) {
    if (!isMissingOnboardingColumn(error)) throw error

    logger.warn(
      { userId, outcomeCode: 'AUTH_USER_READ_LEGACY_SCHEMA' },
      'User table is missing onboarding columns; reading through the compatibility query',
    )
    return queryCompatibleUser(prisma, Prisma.sql`"id" = ${userId}`)
  }
}

// The transaction client needs the same P2022 tolerance as the read path above: a database
// that is missing the onboarding columns must still be able to provision a new signup.
async function findUserInTransaction(db: Prisma.TransactionClient, userId: string) {
  try {
    return await db.user.findUnique({ where: { id: userId } })
  } catch (error) {
    if (!isMissingOnboardingColumn(error)) throw error
    return queryCompatibleUser(db, Prisma.sql`"id" = ${userId}`)
  }
}

async function reconcileVerifiedEmailUser(db: Prisma.TransactionClient, userId: string, email: string) {
  let emailUser: User | null
  try {
    emailUser = await db.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })
  } catch (error) {
    if (!isMissingOnboardingColumn(error)) throw error
    emailUser = await queryCompatibleUser(db, Prisma.sql`LOWER("email") = LOWER(${email})`)
  }

  if (!emailUser) return null
  if (emailUser.id === userId) return emailUser

  try {
    return await db.user.update({
      where: { email: emailUser.email },
      data: { id: userId },
    })
  } catch (error) {
    if (!isMissingOnboardingColumn(error)) throw error
    await db.$executeRaw`UPDATE "User" SET "id" = ${userId} WHERE "email" = ${emailUser.email}`
    return queryCompatibleUser(db, Prisma.sql`"id" = ${userId}`)
  }
}

async function createUserInTransaction(
  db: Prisma.TransactionClient,
  userId: string,
  email: string,
  name: string,
) {
  try {
    return await db.user.create({ data: { id: userId, email, name } })
  } catch (error) {
    if (!isMissingOnboardingColumn(error)) throw error

    logger.warn(
      { userId, outcomeCode: 'AUTH_USER_CREATE_LEGACY_SCHEMA' },
      'User table is missing onboarding columns; provisioning through the compatibility insert',
    )
    await db.$executeRaw`
      INSERT INTO "User" ("id", "email", "name", "createdAt", "updatedAt")
      VALUES (${userId}, ${email}, ${name}, NOW(), NOW())
      ON CONFLICT ("id") DO NOTHING
    `
    const created = await queryCompatibleUser(db, Prisma.sql`"id" = ${userId}`)
    if (created) return created
    throw error
  }
}

function deletionDigest(userId: string, requireConfigured = false) {
  const configured = process.env.DELETION_AUDIT_SECRET?.trim()
  if (!configured) {
    if (requireConfigured && process.env.NODE_ENV === 'production') {
      // Whether a missing secret may be tolerated depends entirely on whether erasure is a
      // live feature, so the two cases are separated rather than collapsed into one policy.
      //
      // ACCOUNT_DELETION_ENABLED off: there are no deletion records for the skipped check to
      // have found, so the check is moot and hard-crashing every new sign-up would be pure
      // downside. Degrade, and say so. This is the case 7154cc7 was reacting to.
      //
      // ACCOUNT_DELETION_ENABLED on: skipping the check silently re-provisions a user who
      // requested erasure, defeating the deletion guarantee with no error and no audit trail.
      // A missing secret must stop provisioning, not quietly widen it — matching this repo's
      // "unconfigured means forbidden" convention (docs/architecture/BACKEND_PLATFORM.md §6).
      if (accountDeletionEnabled()) {
        logger.error(
          { userId, outcomeCode: 'AUTH_DELETION_AUDIT_SECRET_MISSING' },
          'DELETION_AUDIT_SECRET is not configured while account deletion is enabled; refusing to provision',
        )
        throw new Error('Account lifecycle protection is not configured')
      }

      logger.warn(
        { userId, outcomeCode: 'AUTH_DELETION_AUDIT_SECRET_MISSING' },
        'DELETION_AUDIT_SECRET is not configured; skipping deletion state check for provisioning',
      )
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

function provisionUserInTransaction(userId: string, email: string, name: string) {
  return prisma.$transaction(async (tx) => {
    const subjectDigest = deletionDigest(userId, true)
    if (subjectDigest) {
      // `$executeRaw`, never `$queryRaw`: pg_advisory_xact_lock() returns `void`,
      // and $queryRaw tries to deserialize the returned column, which fails with
      // "Failed to deserialize column of type 'void'". $executeRaw discards rows.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${subjectDigest}, 0))`
      const [request, audit] = await Promise.all([
        tx.accountDeletionRequest.findUnique({ where: { subjectDigest }, select: { id: true } }),
        tx.accountDeletionAudit.findUnique({ where: { subjectDigest }, select: { id: true } }),
      ])
      if (request || audit) {
        logger.warn(
          { userId, outcomeCode: 'AUTH_USER_PROVISION_BLOCKED_DELETED' },
          'Refused to provision a user that has a pending or completed account deletion',
        )
        return null
      }
    }

    // See the note above: void-returning locks must go through $executeRaw.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'email:' + email}, 0))`
    const concurrentUser = await findUserInTransaction(tx, userId)
    if (concurrentUser) {
      logger.info(
        { userId, outcomeCode: 'AUTH_USER_PROVISION_CONCURRENT_HIT' },
        'A concurrent request already provisioned this user',
      )
      return concurrentUser
    }

    const legacyUser = await reconcileVerifiedEmailUser(tx, userId, email)
    if (legacyUser) {
      logger.info(
        { userId, outcomeCode: 'AUTH_USER_PROVISION_LEGACY_RECONCILED' },
        'Adopted an existing row that owns this verified email address',
      )
      return legacyUser
    }

    const createdUser = await createUserInTransaction(tx, userId, email, name)
    logger.info(
      { userId, outcomeCode: 'AUTH_USER_PROVISION_CREATED' },
      'Provisioned a new user for onboarding',
    )
    return createdUser
  })
}

async function provisionCurrentUser(userId: string, email: string, name: string) {
  for (let attempt = 1; attempt <= MAX_PROVISION_ATTEMPTS; attempt += 1) {
    try {
      return await provisionUserInTransaction(userId, email, name)
    } catch (error) {
      if (!isUniqueConflict(error)) {
        logger.error(
          { err: error, userId, attempt, outcomeCode: 'AUTH_USER_PROVISION_FAILED' },
          'User provisioning transaction failed',
        )
        throw error
      }

      const concurrentUser = await findUserWithOnboardingFallback(userId)
      if (concurrentUser) {
        if (await deletionStateExists(userId)) {
          logger.warn(
            { userId, attempt, outcomeCode: 'AUTH_USER_PROVISION_BLOCKED_DELETED' },
            'Unique conflict resolved to a user with account deletion state',
          )
          throw error
        }
        logger.info(
          { userId, attempt, outcomeCode: 'AUTH_USER_PROVISION_CONFLICT_RESOLVED' },
          'Unique conflict resolved to the row a concurrent request committed',
        )
        return concurrentUser
      }

      if (attempt >= MAX_PROVISION_ATTEMPTS) {
        logger.error(
          { err: error, userId, attempt, outcomeCode: 'AUTH_USER_PROVISION_CONFLICT_UNRESOLVED' },
          'Unique conflict did not resolve to a usable user row',
        )
        throw error
      }

      logger.warn(
        { err: error, userId, attempt, outcomeCode: 'AUTH_USER_PROVISION_CONFLICT_RETRY' },
        'Unique conflict without a visible row; retrying provisioning',
      )
    }
  }

  // Unreachable: the loop either returns or throws on its final attempt.
  return null
}

export const getCurrentUser = cache(async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const existingUser = await findUserWithOnboardingFallback(userId)
  if (existingUser) {
    if (await deletionStateExists(userId)) {
      logger.warn(
        { userId, outcomeCode: 'AUTH_USER_DELETION_PENDING' },
        'Hid a user that has pending or completed account deletion state',
      )
      return null
    }
    return existingUser
  }

  const clerkUser = await currentUser()
  if (!clerkUser || clerkUser.id !== userId || !clerkUser.primaryEmailAddressId) {
    logger.warn(
      {
        userId,
        outcomeCode: 'AUTH_CLERK_PROFILE_UNAVAILABLE',
        clerkUserLoaded: Boolean(clerkUser),
        clerkUserMatchesSession: clerkUser ? clerkUser.id === userId : false,
        hasPrimaryEmailAddressId: Boolean(clerkUser?.primaryEmailAddressId),
      },
      'Signed-in session has no usable Clerk profile; cannot provision the user',
    )
    return null
  }

  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId,
  )
  if (!primaryEmail || primaryEmail.verification?.status !== 'verified') {
    logger.warn(
      {
        userId,
        outcomeCode: 'AUTH_PRIMARY_EMAIL_UNVERIFIED',
        primaryEmailResolved: Boolean(primaryEmail),
        verificationStatus: primaryEmail?.verification?.status ?? 'missing',
      },
      'Primary email address is not verified; cannot provision the user',
    )
    return null
  }

  const email = primaryEmail.emailAddress.trim().toLowerCase()
  const name = clerkUser.fullName || clerkUser.firstName || 'Hunter'

  logger.info({ userId, outcomeCode: 'AUTH_USER_PROVISION_START' }, 'Provisioning a user for a new Clerk session')
  return provisionCurrentUser(userId, email, name)
})

export async function requireCurrentUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
