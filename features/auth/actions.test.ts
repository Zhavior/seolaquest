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
    lead: { createMany: vi.fn() },
    user: { update: vi.fn() },
  }
  return {
    getCurrentUser: vi.fn(),
    revalidatePath: vi.fn(),
    updateMany: vi.fn(),
    transaction: vi.fn(),
    ensureEnrolled: vi.fn(),
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
vi.mock('@/src/modules/gamify/GamifyEnrollmentService', () => ({
  GamifyEnrollmentService: class {
    ensureEnrolled = mocks.ensureEnrolled
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
    xp: 0,
    level: 1,
    xpRequired: 100,
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
    mocks.ensureEnrolled.mockResolvedValue({ enrolled: true, assigned: 4 })
    mocks.tx.trackedKeyword.findFirst.mockResolvedValue(null)
    mocks.tx.trackedKeyword.count.mockResolvedValue(0)
    mocks.tx.trackedKeyword.create.mockResolvedValue({ id: 'kw_stable_1', phrase: 'need a website', active: true })
    mocks.tx.trackedKeyword.update.mockResolvedValue({ id: 'kw_stable_1', phrase: 'need a website', active: true })
    mocks.tx.tenantScanSchedule.upsert.mockResolvedValue({})
    mocks.tx.lead.createMany.mockResolvedValue({ count: 3 })
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
      // Completing setup pays no XP. XP is minted only from outcomes now, by the
      // Gamify ledger, so what this hands back is what it genuinely produced:
      // the quests it put on the board and the sample signals it seeded.
      reward: {
        questsAssigned: 4,
        sampleQuestsSeeded: 3,
      },
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

  /**
   * `User.xp`/`User.level`/`User.xpRequired`/`User.xpMultiplier` are deprecated
   * columns nothing reads any more. Writing them here would leave a second,
   * stale copy of progression next to `GamifyProfile` — and the HUD reading one
   * while the ledger owns the other is exactly the disagreement this change
   * removed. The columns still exist for the migration, so an accidental write
   * would succeed silently; that is why this is asserted rather than assumed.
   */
  it('never writes the deprecated progression columns', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingStep: 6 }))

    await completeOnboardingAction()

    const [{ data }] = mocks.tx.user.update.mock.calls[0]
    for (const column of ['xp', 'level', 'xpRequired', 'xpMultiplier']) {
      expect(data).not.toHaveProperty(column)
    }
  })

  it('seeds three labelled tutorial signals against the new keyword', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingStep: 6 }))

    await completeOnboardingAction()

    expect(mocks.tx.lead.createMany).toHaveBeenCalledTimes(1)
    const [call] = mocks.tx.lead.createMany.mock.calls
    expect(call[0].skipDuplicates).toBe(true)
    expect(call[0].data).toHaveLength(3)
    for (const seeded of call[0].data) {
      expect(seeded).toMatchObject({ userId: 'user_1', keywordId: 'kw_stable_1', platform: 'SAMPLE' })
      expect(seeded.content).toContain('[TUTORIAL TARGET — HIGH INTENT]')
      // A fabricated external permalink would either 404 or resolve to an
      // unrelated real post, so seeded rows must stay in-app.
      expect(seeded.url.startsWith('/')).toBe(true)
    }
  })

  /**
   * Enrollment happens after the commit, so a quest-catalog problem cannot roll
   * back a signup that already succeeded. The cost of that choice is that the
   * banner might report zero quests on a bad day — which is the honest number,
   * and self-correcting, because the shell layout enrolls on the next request.
   */
  it('reports the quests enrollment actually assigned, outside the transaction', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingStep: 6 }))
    mocks.ensureEnrolled.mockResolvedValue({ enrolled: true, assigned: 2 })

    await expect(completeOnboardingAction()).resolves.toMatchObject({
      reward: { questsAssigned: 2, sampleQuestsSeeded: 3 },
    })
    expect(mocks.ensureEnrolled).toHaveBeenCalledWith('user_1')
  })

  it('still completes setup when enrollment fails, reporting zero rather than throwing', async () => {
    mocks.getCurrentUser.mockResolvedValue(currentUser({ onboardingStep: 6 }))
    mocks.ensureEnrolled.mockRejectedValue(new Error('quest catalog unavailable'))

    await expect(completeOnboardingAction()).resolves.toMatchObject({
      ok: true,
      keyword: { id: 'kw_stable_1' },
      reward: { questsAssigned: 0, sampleQuestsSeeded: 3 },
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
