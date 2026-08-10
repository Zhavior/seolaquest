import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  userFindUnique: vi.fn(),
  gamifyProfileFindUnique: vi.fn(),
  trackedKeywordCount: vi.fn(),
  leadCount: vi.fn(),
  leadFindMany: vi.fn(),
  leadGroupBy: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: mocks.userFindUnique },
    // Progression is read from the gamify ledger now, not from `User.xp`.
    gamifyProfile: { findUnique: mocks.gamifyProfileFindUnique },
    trackedKeyword: { count: mocks.trackedKeywordCount },
    lead: {
      count: mocks.leadCount,
      findMany: mocks.leadFindMany,
      groupBy: mocks.leadGroupBy,
    },
  },
}))

import { AnalyticsService } from './AnalyticsService'

describe('AnalyticsService truth boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.userFindUnique.mockResolvedValue({
      spellsCast: 0,
      questsExported: 0,
    })
    mocks.gamifyProfileFindUnique.mockResolvedValue(null)
    mocks.trackedKeywordCount.mockResolvedValue(0)
    mocks.leadCount.mockResolvedValue(0)
    mocks.leadFindMany.mockResolvedValue([])
    mocks.leadGroupBy.mockResolvedValue([])
  })

  it('returns no cross-user leaderboard until participation consent exists', async () => {
    await expect(AnalyticsService.getLeaderboard()).resolves.toEqual([])
    expect(mocks.requireCurrentUser).toHaveBeenCalledTimes(1)
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })

  it('does not query product data when authentication fails', async () => {
    mocks.requireCurrentUser.mockRejectedValue(new Error('Unauthorized'))

    await expect(AnalyticsService.getGuildStats()).rejects.toThrow('Unauthorized')
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
    expect(mocks.leadFindMany).not.toHaveBeenCalled()
  })

  it('returns zero, empty, or unknown when the tenant has no observations', async () => {
    const result = await AnalyticsService.getGuildStats()

    expect(result).toMatchObject({
      monstersDefeated: 0,
      spellsCast: 0,
      questsExported: 0,
      conversionRate: 0,
      criticalHitRate: 0,
      topChannel: 'Unknown',
      channels: [],
      scoutSpeed: 'Not measured',
      manaEfficiency: 0,
      manaPerReply: 0,
      huntingStreak: 0,
      leaderboard: [],
      deadliestWeapon: {
        phrase: 'None yet',
        count: 0,
        artifactName: 'No contacted-keyword data yet',
      },
    })
  })

  /*
   * `User.xp`/`User.level` are deprecated columns that nothing reads any more.
   * They were a second, independent copy of progression, and two copies of one
   * number always end up disagreeing — the guild page would show a level the
   * ledger could not account for. `GamifyProfile` is the only source now, and a
   * missing row means "has earned nothing yet", not "error".
   */
  it('reads progression from the gamify ledger rather than the deprecated user columns', async () => {
    mocks.gamifyProfileFindUnique.mockResolvedValue({ lifetimeXp: 380, reputation: 6 })

    const result = await AnalyticsService.getGuildStats()

    expect(mocks.gamifyProfileFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    )
    // 380 lifetime XP sits inside level 3, whose band runs 283 -> 520.
    expect(result).toMatchObject({ level: 3, xp: 97, xpRequired: 237 })
  })

  it('renders an account with no ledger row as unranked instead of failing', async () => {
    mocks.gamifyProfileFindUnique.mockResolvedValue(null)

    await expect(AnalyticsService.getGuildStats()).resolves.toMatchObject({
      level: 1,
      xp: 0,
      xpRequired: 100,
    })
  })

  it('derives keyword and channel values from tenant rows without calling contact state a conversion', async () => {
    mocks.trackedKeywordCount.mockResolvedValue(2)
    mocks.leadCount.mockResolvedValue(4)
    mocks.leadFindMany
      .mockResolvedValueOnce([
        { keywordId: 'k1', platform: 'REDDIT', keyword: { phrase: 'crm help' } },
        { keywordId: 'k1', platform: 'REDDIT', keyword: { phrase: 'crm help' } },
      ])
      .mockResolvedValueOnce([])
    mocks.leadGroupBy.mockResolvedValue([
      { platform: 'REDDIT', _count: { id: 3 } },
      { platform: 'TWITTER', _count: { id: 1 } },
    ])

    const result = await AnalyticsService.getGuildStats()

    expect(result.conversionRate).toBe(0)
    expect(result.deadliestWeapon).toMatchObject({ phrase: 'crm help', count: 2, platform: 'REDDIT' })
    expect(result.channels).toEqual([
      { name: 'REDDIT', percent: 75, color: '#FF5722' },
      { name: 'TWITTER', percent: 25, color: '#06B6D4' },
    ])
    expect(result.criticalHitRate).toBe(0)
    expect(result.scoutSpeed).toBe('Not measured')
  })
})
