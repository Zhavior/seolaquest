import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  userFindUnique: vi.fn(),
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
    trackedKeyword: { count: mocks.trackedKeywordCount },
    lead: {
      count: mocks.leadCount,
      findMany: mocks.leadFindMany,
      groupBy: mocks.leadGroupBy,
    },
  },
}))

import { AnalyticsService } from '@/src/modules/analytics/application/AnalyticsService'
import { applyXpGain } from '@/src/modules/progression/domain/progression'

describe('Guild & Gamification Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'user-123' })
    mocks.userFindUnique.mockResolvedValue({
      level: 3,
      xp: 40,
      xpRequired: 225,
      spellsCast: 12,
      questsExported: 5,
    })
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
        level: true,
        xp: true,
        xpRequired: true,
        spellsCast: true,
        questsExported: true,
      },
    })
    expect(stats.level).toBe(3)
    expect(stats.xp).toBe(40)
    expect(stats.xpRequired).toBe(225)
    expect(stats.spellsCast).toBe(12)
    expect(stats.questsExported).toBe(5)
    expect(stats.monstersDefeated).toBe(18)
    expect(stats.totalKeywords).toBe(4)
  })

  it('leveling up recomputes xpRequired and xpMultiplier accurately without drift', () => {
    const level1State = { xp: 90, level: 1, xpRequired: 100 }
    const result = applyXpGain(level1State, 20)

    expect(result.didLevelUp).toBe(true)
    expect(result.level).toBe(2)
    expect(result.xp).toBe(10)
    expect(result.xpRequired).toBe(150)
    expect(result.xpMultiplier).toBe(1.1)

    // Second level up
    const nextLevel = applyXpGain(result, 150)
    expect(nextLevel.didLevelUp).toBe(true)
    expect(nextLevel.level).toBe(3)
    expect(nextLevel.xp).toBe(10)
    expect(nextLevel.xpRequired).toBe(225)
    expect(nextLevel.xpMultiplier).toBe(1.2)
  })

  it('unlocks achievements dynamically based on database progress metrics', async () => {
    const stats = await AnalyticsService.getGuildStats('weekly')
    const archmageAchievement = stats.achievements.find((a) => a.id === 'archmage')
    const exporterAchievement = stats.achievements.find((a) => a.id === 'exporter')

    expect(archmageAchievement?.progress).toBe(12)
    expect(exporterAchievement?.unlocked).toBe(true)
  })
})
