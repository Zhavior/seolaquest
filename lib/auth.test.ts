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
