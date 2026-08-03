import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  userFindUnique: vi.fn(),
  trackedKeywordCount: vi.fn(),
  leadCount: vi.fn(),
  leadFindMany: vi.fn(),
  leadGroupBy: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: mocks.userFindUnique },
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
      level: 1,
      xp: 0,
      xpRequired: 100,
      spellsCast: 0,
      questsExported: 0,
    })
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
