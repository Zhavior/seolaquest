import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    trackedKeyword: {
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    tenantScanSchedule: { upsert: vi.fn() },
    user: { update: vi.fn() },
  }
  return {
    getCurrentUser: vi.fn(),
    revalidatePath: vi.fn(),
    updateMany: vi.fn(),
    transaction: vi.fn(),
    tx,
  }
})

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/src/modules/keywords/application/KeywordService', () => ({
  MAX_ACTIVE_KEYWORDS_PER_TENANT: 10,
}))
vi.mock('@/lib/prisma', () => ({
  default: {
    user: { updateMany: mocks.updateMany },
    $transaction: mocks.transaction,
  },
}))

import {
  completeOnboardingAction,
  saveOnboardingStepAction,
  skipOnboardingStepAction,
} from './actions'

function currentUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user_1',
    onboardingComplete: false,
    onboardingStep: 1,
    ...overrides,
  }
}

function lockedUser(overrides: Record<string, unknown> = {}) {
  return {
    onboardingComplete: false,
    onboardingStep: 6,
    name: 'Boyd',
    profileIconKey: 'target',
    businessDescription: 'Accessible websites',
    targetCustomer: 'Local service business',
    firstKeyword: 'need a website',
    preferredSource: 'REDDIT',
    ...overrides,
  }
}

describe('Phase 2 onboarding actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue(currentUser())
    mocks.updateMany.mockResolvedValue({ count: 1 })
    mocks.transaction.mockImplementation(async (callback) => callback(mocks.tx))
    mocks.tx.$queryRaw.mockResolvedValue([lockedUser()])
    mocks.tx.trackedKeyword.findFirst.mockResolvedValue(null)
    mocks.tx.trackedKeyword.count.mockResolvedValue(0)
    mocks.tx.trackedKeyword.create.mockResolvedValue({ id: 'kw_stable_1', phrase: 'need a website', active: true })
    mocks.tx.trackedKeyword.update.mockResolvedValue({ id: 'kw_stable_1', phrase: 'need a website', active: true })
    mocks.tx.tenantScanSchedule.upsert.mockResolvedValue({})
    mocks.tx.user.update.mockResolvedValue({})
  })

  it('saves one normalized step durably and advances resume state', async () => {
    const result = await saveOnboardingStepAction({ step: 1, value: { displayName: '  Boyd   Santos ', profileIconKey: 'target' } })

    expect(result).toEqual({ ok: true, nextStep: 2 })
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 'user_1', onboardingComplete: false },
      data: { name: 'Boyd Santos', profileIconKey: 'target', onboardingStep: 2 },
    })
  })

  it('does not let a client jump over unsaved steps', async () => {
    await expect(saveOnboardingStepAction({ step: 4, value: 'need a website' })).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_STEP',
    })
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it('rejects an over-80-character keyword without truncating or persisting it', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingStep: 4 }))
    const invalidKeyword = 'k'.repeat(81)

    await expect(saveOnboardingStepAction({ step: 4, value: invalidKeyword })).resolves.toMatchObject({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Use 80 characters or fewer.',
    })
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it('allows skip only on safe optional context and records progress', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingStep: 2 }))

    await expect(skipOnboardingStepAction(2)).resolves.toEqual({ ok: true, nextStep: 3 })
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 'user_1', onboardingComplete: false },
      data: { businessDescription: null, onboardingStep: 3 },
    })
  })

  it('excludes completed users from further onboarding mutations', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingComplete: true, onboardingStep: 6 }))

    await expect(saveOnboardingStepAction({ step: 1, value: { displayName: 'Boyd', profileIconKey: 'target' } })).resolves.toMatchObject({
      ok: false,
      code: 'ALREADY_COMPLETE',
    })
    await expect(completeOnboardingAction()).resolves.toMatchObject({
      ok: false,
      code: 'ALREADY_COMPLETE',
    })
    expect(mocks.updateMany).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('creates the real keyword and completes the user in one transaction', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingStep: 6 }))

    await expect(completeOnboardingAction()).resolves.toEqual({
      ok: true,
      keyword: { id: 'kw_stable_1', phrase: 'need a website' },
    })
    expect(mocks.tx.trackedKeyword.create).toHaveBeenCalledWith({
      data: { userId: 'user_1', phrase: 'need a website' },
      select: { id: true, phrase: true, active: true },
    })
    expect(mocks.tx.tenantScanSchedule.upsert).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
      create: { userId: 'user_1', enabled: true },
      update: { enabled: true },
    })
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: {
        onboardingComplete: true,
        onboardingStep: 6,
        profileIconKey: 'target',
      },
    })
  })

  it('returns an existing keyword stable ID instead of creating a duplicate', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingStep: 6 }))
    mocks.tx.trackedKeyword.findFirst.mockResolvedValue({ id: 'kw_existing', phrase: 'Need a Website', active: true })
    mocks.tx.trackedKeyword.update.mockResolvedValue({ id: 'kw_existing', phrase: 'Need a Website', active: true })

    await expect(completeOnboardingAction()).resolves.toMatchObject({
      ok: true,
      keyword: { id: 'kw_existing', phrase: 'Need a Website' },
    })
    expect(mocks.tx.trackedKeyword.create).not.toHaveBeenCalled()
  })

  it('revalidates persisted keyword length at completion without truncating it', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingStep: 6 }))
    mocks.tx.$queryRaw.mockResolvedValue([lockedUser({ firstKeyword: 'k'.repeat(81) })])

    await expect(completeOnboardingAction()).resolves.toMatchObject({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Use 80 characters or fewer.',
    })
    expect(mocks.tx.trackedKeyword.findFirst).not.toHaveBeenCalled()
    expect(mocks.tx.trackedKeyword.create).not.toHaveBeenCalled()
    expect(mocks.tx.user.update).not.toHaveBeenCalled()
  })

  it('fails safely when the session ends and does not start database work', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    await expect(completeOnboardingAction()).resolves.toMatchObject({
      ok: false,
      code: 'SIGNED_OUT',
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})
