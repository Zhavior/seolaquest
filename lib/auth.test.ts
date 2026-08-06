import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'

const mocks = vi.hoisted(() => {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    accountDeletionRequest: {
      findUnique: vi.fn(),
    },
    accountDeletionAudit: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  }

  return {
    auth: vi.fn(),
    currentUser: vi.fn(),
    prisma,
    logger: {
      fatal: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
    },
  }
})

vi.mock('@clerk/nextjs/server', () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
}))

vi.mock('@/lib/prisma', () => ({
  default: mocks.prisma,
}))

vi.mock('@/src/modules/lifecycle/domain/accountDeletion', () => ({
  subjectDigestForUserId: vi.fn(() => 'digest-user-1'),
}))

vi.mock('@/src/modules/core/infrastructure/logger', () => ({
  logger: mocks.logger,
}))

import { getCurrentUser, findUserWithOnboardingFallback } from '@/lib/auth'

function missingColumnError(column: string) {
  return new Prisma.PrismaClientKnownRequestError(
    `The column \`${column}\` does not exist in the current database.`,
    {
      code: 'P2022',
      clientVersion: '5.10.2',
      meta: { modelName: 'User', column },
    },
  )
}

describe('getCurrentUser compatibility fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ userId: 'user_1' })
    mocks.prisma.accountDeletionRequest.findUnique.mockResolvedValue(null)
    mocks.prisma.accountDeletionAudit.findUnique.mockResolvedValue(null)
  })

  it('falls back to raw SQL when onboarding columns are missing', async () => {
    mocks.prisma.user.findUnique.mockRejectedValueOnce(missingColumnError('User.onboardingStep'))
    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      {
        id: 'user_1',
        email: 'user@example.com',
        name: 'Boyd',
        title: 'Lead Hunter',
        businessDescription: 'Test business',
        targetCustomer: 'SMBs',
        firstKeyword: 'need a website',
        preferredSource: 'REDDIT',
        emailDigest: true,
        radarAlerts: true,
        crmWebhookUrl: 'https://example.com/webhook',
        questsRemaining: 3,
        spellsCast: 8,
        questsExported: 2,
        maxCredits: 10,
        xpMultiplier: 1,
        level: 2,
        xp: 25,
        xpRequired: 100,
        unlockedTheme: 'PARCHMENT_WOOD',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        updatedAt: new Date('2026-08-02T00:00:00.000Z'),
      },
    ])

    const user = await getCurrentUser()

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(user).toMatchObject({
      id: 'user_1',
      email: 'user@example.com',
      onboardingComplete: false,
      onboardingStep: 1,
      preferredSource: 'REDDIT',
      level: 2,
      questsRemaining: 3,
      maxCredits: 10,
    })
  })

  it('findUserWithOnboardingFallback returns profileIconKey: null without throwing', async () => {
    mocks.prisma.user.findUnique.mockRejectedValueOnce(missingColumnError('User.profileIconKey'))
    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      {
        id: 'user_2',
        email: 'user2@example.com',
        profileIconKey: null,
      },
    ])

    const user = await findUserWithOnboardingFallback('user_2')

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(user).toMatchObject({
      id: 'user_2',
      profileIconKey: null,
    })
  })

  it('findUserWithOnboardingFallback maps profileIconKey correctly when the column exists', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user_3',
      email: 'user3@example.com',
      profileIconKey: 'sword',
    })

    const user = await findUserWithOnboardingFallback('user_3')

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user_3' } })
    expect(mocks.prisma.$queryRaw).not.toHaveBeenCalled()
    expect(user).toMatchObject({
      id: 'user_3',
      profileIconKey: 'sword',
    })
  })

  it('returns null when auth has no current user id', async () => {
    mocks.auth.mockResolvedValueOnce({ userId: null })

    await expect(getCurrentUser()).resolves.toBeNull()
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled()
  })
})

function uniqueConflictError(target: string[]) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '5.10.2',
    meta: { modelName: 'User', target },
  })
}

function clerkSignUpUser() {
  return {
    id: 'user_1',
    primaryEmailAddressId: 'idn_1',
    emailAddresses: [
      {
        id: 'idn_1',
        emailAddress: 'New.Hunter@Example.com',
        verification: { status: 'verified' },
      },
    ],
    fullName: 'New Hunter',
    firstName: 'New',
  }
}

function onboardingReadyUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user_1',
    email: 'new.hunter@example.com',
    name: 'New Hunter',
    profileIconKey: null,
    title: null,
    onboardingComplete: false,
    onboardingStep: 1,
    businessDescription: null,
    targetCustomer: null,
    firstKeyword: null,
    preferredSource: null,
    emailDigest: true,
    radarAlerts: true,
    crmWebhookUrl: null,
    questsRemaining: 0,
    spellsCast: 0,
    questsExported: 0,
    maxCredits: 0,
    xpMultiplier: 1,
    level: 1,
    xp: 0,
    xpRequired: 100,
    unlockedTheme: 'PARCHMENT_WOOD',
    createdAt: new Date('2026-08-05T00:00:00.000Z'),
    updatedAt: new Date('2026-08-05T00:00:00.000Z'),
    ...overrides,
  }
}

function createTransactionClient() {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    },
    accountDeletionRequest: { findUnique: vi.fn().mockResolvedValue(null) },
    accountDeletionAudit: { findUnique: vi.fn().mockResolvedValue(null) },
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(1),
  }
}

describe('getCurrentUser provisioning for new sign-ups', () => {
  let tx: ReturnType<typeof createTransactionClient>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    // Keep the account-deletion digest unconfigured so tests exercise the provisioning
    // branches rather than the lifecycle guard, which owns its own suite.
    vi.stubEnv('DELETION_AUDIT_SECRET', '')
    mocks.auth.mockResolvedValue({ userId: 'user_1' })
    mocks.currentUser.mockResolvedValue(clerkSignUpUser())
    mocks.prisma.accountDeletionRequest.findUnique.mockResolvedValue(null)
    mocks.prisma.accountDeletionAudit.findUnique.mockResolvedValue(null)
    mocks.prisma.user.findUnique.mockResolvedValue(null)

    tx = createTransactionClient()
    mocks.prisma.$transaction.mockImplementation(
      async (run: (client: typeof tx) => Promise<unknown>) => run(tx),
    )
  })

  it('creates an onboarding-ready user on a first-time sign-up', async () => {
    tx.user.create.mockResolvedValue(onboardingReadyUser())

    const user = await getCurrentUser()

    expect(tx.user.create).toHaveBeenCalledWith({
      data: { id: 'user_1', email: 'new.hunter@example.com', name: 'New Hunter' },
    })
    expect(user).toMatchObject({
      id: 'user_1',
      email: 'new.hunter@example.com',
      onboardingComplete: false,
      onboardingStep: 1,
    })
  })

  it('takes the advisory lock through $executeRaw so a void return never breaks sign-up', async () => {
    // Regression: pg_advisory_xact_lock() returns `void`. Issuing it through
    // $queryRaw makes Prisma try to deserialize that column and throw
    // "Failed to deserialize column of type 'void'", which failed provisioning
    // for every new user. $queryRaw here rejects the way Prisma really did.
    tx.$queryRaw.mockRejectedValue(
      new Error("Failed to deserialize column of type 'void'"),
    )
    tx.user.create.mockResolvedValue(onboardingReadyUser())

    const user = await getCurrentUser()

    expect(tx.$executeRaw).toHaveBeenCalled()
    const lockedViaExecuteRaw = tx.$executeRaw.mock.calls.some((call) =>
      call[0]?.some?.((fragment: string) => fragment.includes('pg_advisory_xact_lock')),
    )
    expect(lockedViaExecuteRaw).toBe(true)
    expect(user).toMatchObject({ id: 'user_1', onboardingComplete: false })
  })

  it('returns the row a concurrent sign-up committed inside the transaction', async () => {
    tx.user.findUnique.mockResolvedValue(onboardingReadyUser({ name: 'Concurrent Hunter' }))

    const user = await getCurrentUser()

    expect(tx.user.create).not.toHaveBeenCalled()
    expect(user).toMatchObject({ id: 'user_1', name: 'Concurrent Hunter', onboardingComplete: false })
  })

  it('recovers from a unique conflict raised by a concurrent double sign-up', async () => {
    tx.user.create.mockRejectedValue(uniqueConflictError(['email']))
    mocks.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(onboardingReadyUser({ name: 'Race Winner' }))

    const user = await getCurrentUser()

    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(user).toMatchObject({
      id: 'user_1',
      name: 'Race Winner',
      onboardingComplete: false,
      onboardingStep: 1,
    })
  })

  it('retries provisioning once when a unique conflict leaves no visible row', async () => {
    tx.user.create
      .mockRejectedValueOnce(uniqueConflictError(['email']))
      .mockResolvedValueOnce(onboardingReadyUser())

    const user = await getCurrentUser()

    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(2)
    expect(user).toMatchObject({ id: 'user_1', onboardingComplete: false })
  })

  it('adopts the legacy row that already owns the verified email address', async () => {
    tx.user.findFirst.mockResolvedValue(onboardingReadyUser({ id: 'legacy_user' }))
    tx.user.update.mockResolvedValue(onboardingReadyUser({ name: 'Legacy Hunter' }))

    const user = await getCurrentUser()

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { email: 'new.hunter@example.com' },
      data: { id: 'user_1' },
    })
    expect(tx.user.create).not.toHaveBeenCalled()
    expect(user).toMatchObject({
      id: 'user_1',
      name: 'Legacy Hunter',
      onboardingComplete: false,
      onboardingStep: 1,
    })
  })

  it('provisions through raw SQL when the onboarding columns are missing (P2022)', async () => {
    mocks.prisma.user.findUnique.mockRejectedValueOnce(missingColumnError('User.onboardingStep'))
    mocks.prisma.$queryRaw.mockResolvedValueOnce([])

    tx.user.findUnique.mockRejectedValue(missingColumnError('User.onboardingStep'))
    tx.user.findFirst.mockRejectedValue(missingColumnError('User.onboardingStep'))
    tx.user.create.mockRejectedValue(missingColumnError('User.onboardingStep'))
    tx.$queryRaw
      // compatibility read by id
      .mockResolvedValueOnce([])
      // compatibility read by email
      .mockResolvedValueOnce([])
      // compatibility read after the raw insert
      .mockResolvedValueOnce([
        {
          id: 'user_1',
          email: 'new.hunter@example.com',
          name: 'New Hunter',
          title: null,
          createdAt: new Date('2026-08-05T00:00:00.000Z'),
          updatedAt: new Date('2026-08-05T00:00:00.000Z'),
        },
      ])

    const user = await getCurrentUser()

    // The advisory lock and the compatibility INSERT both go through $executeRaw.
    expect(tx.$executeRaw).toHaveBeenCalledTimes(2)
    expect(user).toMatchObject({
      id: 'user_1',
      email: 'new.hunter@example.com',
      name: 'New Hunter',
      onboardingComplete: false,
      onboardingStep: 1,
      level: 1,
      xpRequired: 100,
      unlockedTheme: 'PARCHMENT_WOOD',
    })
  })

  it('logs a warning when lifecycle protection is unconfigured in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    await getCurrentUser()
    expect(mocks.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ outcomeCode: 'AUTH_DELETION_AUDIT_SECRET_MISSING' }),
      expect.any(String),
    )
  })

  it('logs the reason when Clerk has no verified primary email yet', async () => {
    mocks.currentUser.mockResolvedValue({
      ...clerkSignUpUser(),
      emailAddresses: [
        { id: 'idn_1', emailAddress: 'New.Hunter@Example.com', verification: { status: 'unverified' } },
      ],
    })

    await expect(getCurrentUser()).resolves.toBeNull()
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
    expect(mocks.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        outcomeCode: 'AUTH_PRIMARY_EMAIL_UNVERIFIED',
        verificationStatus: 'unverified',
      }),
      expect.any(String),
    )
  })
})
