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

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: mocks.userFindUnique },
    gamifyProfile: { findUnique: mocks.gamifyProfileFindUnique },
    trackedKeyword: { count: mocks.trackedKeywordCount },
    lead: {
      count: mocks.leadCount,
      findMany: mocks.leadFindMany,
      groupBy: mocks.leadGroupBy,
    },
  },
}))

import { AnalyticsService } from '@/src/modules/analytics/application/AnalyticsService'

describe('Guild & Gamification Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'user-123' })
    mocks.userFindUnique.mockResolvedValue({
      spellsCast: 12,
      questsExported: 5,
    })
    mocks.gamifyProfileFindUnique.mockResolvedValue({ lifetimeXp: 0, reputation: 0 })
    mocks.trackedKeywordCount.mockResolvedValue(4)
    mocks.leadCount.mockResolvedValue(18)
    mocks.leadFindMany.mockResolvedValue([])
    mocks.leadGroupBy.mockResolvedValue([
      { platform: 'TWITTER', _count: { id: 10 } },
      { platform: 'REDDIT', _count: { id: 8 } },
    ])
  })

  it('AnalyticsService.getGuildStats reads live User and Lead stats from Postgres via Prisma', async () => {
    const stats = await AnalyticsService.getGuildStats('weekly')

    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: {
        spellsCast: true,
        questsExported: true,
      },
    })
    expect(stats.spellsCast).toBe(12)
    expect(stats.questsExported).toBe(5)
    expect(stats.monstersDefeated).toBe(18)
    expect(stats.totalKeywords).toBe(4)
  })

  it('reports progression from the gamify ledger, not the legacy user columns', async () => {
    // 100 lifetime XP is exactly the level-2 threshold on GamifyLevelCurve, and
    // level 2 costs 183 XP end to end (round(100 * 2^1.5) - 100).
    mocks.gamifyProfileFindUnique.mockResolvedValue({ lifetimeXp: 100, reputation: 3 })

    const stats = await AnalyticsService.getGuildStats('weekly')

    expect(stats.level).toBe(2)
    expect(stats.xp).toBe(0)
    expect(stats.xpRequired).toBe(183)
  })

  it('unlocks achievements dynamically based on database progress metrics', async () => {
    const stats = await AnalyticsService.getGuildStats('weekly')
    const archmageAchievement = stats.achievements.find((a) => a.id === 'archmage')
    const exporterAchievement = stats.achievements.find((a) => a.id === 'exporter')

    expect(archmageAchievement?.progress).toBe(12)
    expect(exporterAchievement?.unlocked).toBe(true)
  })
})
