import { describe, expect, it } from 'vitest'
import { GamifyLevelCurve } from '../GamifyLevelCurve'

describe('GamifyLevelCurve', () => {
  it('uses deterministic cumulative XP thresholds', () => {
    expect(GamifyLevelCurve.cumulativeXpRequiredForLevel(1)).toBe(0)
    expect(GamifyLevelCurve.cumulativeXpRequiredForLevel(2)).toBe(100)
    expect(GamifyLevelCurve.cumulativeXpRequiredForLevel(3)).toBe(283)
    expect(GamifyLevelCurve.cumulativeXpRequiredForLevel(4)).toBe(520)
  })

  it('maps lifetime XP to level and progress', () => {
    expect(GamifyLevelCurve.levelForLifetimeXp(99)).toBe(1)
    expect(GamifyLevelCurve.levelForLifetimeXp(100)).toBe(2)
    expect(GamifyLevelCurve.levelForLifetimeXp(283)).toBe(3)

    expect(GamifyLevelCurve.progressForLifetimeXp(100)).toMatchObject({
      level: 2,
      currentLevelXp: 100,
      nextLevelXp: 283,
      progressPercent: 0,
      curveVersion: 1,
    })
  })
})
