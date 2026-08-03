import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GuildStats } from '../../types'
import { useGuildState } from '../useGuildState'

const emptyStats: GuildStats = {
  monstersDefeated: 0,
  spellsCast: 0,
  questsExported: 0,
  deadliestWeapon: { phrase: 'None yet', count: 0 },
  conversionRate: 0,
  criticalHitRate: 0,
  topChannel: 'Unknown',
  scoutSpeed: 'Not measured',
}

describe('useGuildState', () => {
  it('keeps missing observations empty or zero', () => {
    const { result } = renderHook(() => useGuildState({ stats: emptyStats }))

    expect(result.current.topThree).toEqual([])
    expect(result.current.tableHunters).toEqual([])
    expect(result.current.channels).toEqual([])
    expect(result.current.achievementsList).toEqual([])
    expect(result.current.manaEfficiency).toBe(0)
    expect(result.current.manaPerReply).toBe(0)
    expect(result.current.huntingStreak).toBe(0)
    expect(result.current.deadliestWeaponCount).toBe(0)
    expect(result.current.deadliestArtifact).toBe('No contacted-keyword data yet')
  })

  it('does not multiply leaderboard values when the timeframe changes', () => {
    const hunter = {
      id: 'owner-1',
      rank: 1,
      name: 'Measured Hunter',
      alias: 'Measured Hunter',
      classTitle: 'Hunter',
      bountiesSlayed: 2,
      manaEfficiency: 0,
      activeStreak: 0,
    }
    const { result } = renderHook(() => useGuildState({
      stats: { ...emptyStats, leaderboard: [hunter] },
    }))

    act(() => result.current.setTimeframe('alltime'))

    expect(result.current.topThree).toEqual([hunter])
    expect(result.current.topThree[0].bountiesSlayed).toBe(2)
  })

  it('does not invent auto replies from legacy activity counts', () => {
    const { result } = renderHook(() => useGuildState({
      stats: { ...emptyStats, heatmap: { '2026-07-29': 5 } },
    }))

    expect(result.current.getDayMetrics('2026-07-29')).toEqual({ count: 5, autoReplies: 0 })
  })
})
