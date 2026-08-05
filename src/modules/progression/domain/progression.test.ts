import { describe, expect, it } from 'vitest'
import {
  applyXpGain,
  XP_FIRST_QUEST_BONUS,
  XP_PER_CLAIMED_QUEST,
} from './progression'

const fresh = { xp: 0, level: 1, xpRequired: 100 }

describe('applyXpGain', () => {
  it('adds xp without levelling when the bar is not reached', () => {
    expect(applyXpGain(fresh, XP_PER_CLAIMED_QUEST)).toEqual({
      xp: 10,
      level: 1,
      xpRequired: 100,
      xpMultiplier: 1,
      didLevelUp: false,
      levelsGained: 0,
    })
  })

  it('carries the remainder into the next level and raises the bar and xpMultiplier', () => {
    expect(applyXpGain({ xp: 95, level: 1, xpRequired: 100 }, XP_PER_CLAIMED_QUEST)).toEqual({
      xp: 5,
      level: 2,
      xpRequired: 150,
      xpMultiplier: 1.1,
      didLevelUp: true,
      levelsGained: 1,
    })
  })

  it('climbs several levels when one award clears more than one bar', () => {
    const result = applyXpGain(fresh, 300)
    expect(result.level).toBe(3)
    expect(result.levelsGained).toBe(2)
    expect(result.xp).toBe(50)
    expect(result.xpRequired).toBe(225)
    expect(result.xpMultiplier).toBe(1.2)
  })

  it('grants the first-quest bonus without levelling a fresh account', () => {
    const result = applyXpGain(fresh, XP_FIRST_QUEST_BONUS)
    expect(result).toMatchObject({ xp: 50, level: 1, xpMultiplier: 1, didLevelUp: false })
  })

  it('ignores a non-positive award instead of removing progress', () => {
    expect(applyXpGain({ xp: 40, level: 2, xpRequired: 150 }, -25)).toMatchObject({
      xp: 40,
      level: 2,
      xpMultiplier: 1.1,
      didLevelUp: false,
    })
  })

  it('repairs a corrupt bar rather than looping forever', () => {
    const result = applyXpGain({ xp: 0, level: 1, xpRequired: 0 }, XP_FIRST_QUEST_BONUS)
    expect(result.xpRequired).toBeGreaterThan(0)
    expect(result.level).toBe(1)
    expect(result.xp).toBe(50)
    expect(result.xpMultiplier).toBe(1)
  })
})
