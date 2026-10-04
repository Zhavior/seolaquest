import { describe, expect, it } from 'vitest'
import { CLAIM_MIN_SCORE, CLAIM_XP, levelTable } from '../rules'
import { SAMPLE_SETS } from './data'
import {
  SAMPLE_QUESTS,
  SAMPLE_START_MANA,
  canScan,
  claim,
  claimReward,
  dismiss,
  initialState,
  questProgress,
  questReady,
  recordOutcome,
  scan,
  standing,
} from './engine'

const set = SAMPLE_SETS[0]
const strong = set.posts.find((post) => post.score >= CLAIM_MIN_SCORE)!
const weak = set.posts.find((post) => post.score < CLAIM_MIN_SCORE && post.score >= 40)!
const cumulative = levelTable(10).map((row) => row.cumulativeXp)

describe('sample hunt rules', () => {
  it('spends 1 mana per scan and pays no XP for it', () => {
    const next = scan(initialState(), set)
    expect(next.mana).toBe(SAMPLE_START_MANA - 1)
    expect(next.xp).toBe(0)
  })

  it('refuses to scan with no mana left', () => {
    let state = initialState()
    for (let i = 0; i < SAMPLE_START_MANA; i += 1) state = scan(state, set)
    expect(canScan(state)).toBe(false)
    expect(scan(state, set).mana).toBe(0)
  })

  it('pays the real claim XP only at or above the real score line', () => {
    const paid = claim(initialState(), strong)
    expect(paid.xp).toBe(CLAIM_XP)
    const unpaid = claim(initialState(), weak)
    expect(unpaid.xp).toBe(0)
    expect(unpaid.claimed).toContain(weak.id)
  })

  it('pays a post once', () => {
    const once = claim(initialState(), strong)
    const twice = claim(once, strong)
    expect(twice.xp).toBe(CLAIM_XP)
    expect(twice.claimed).toHaveLength(1)
  })

  it('counts unpaid claims toward quest progress', () => {
    const state = claim(initialState(), weak)
    const first = SAMPLE_QUESTS.find((quest) => quest.code === 'first_contact')!
    expect(questProgress(state, first)).toBe(1)
    expect(questReady(state, first)).toBe(true)
  })

  it('pays a quest reward once, and only when the target is met', () => {
    const daily = SAMPLE_QUESTS.find((quest) => quest.code === 'daily_patrol')!
    let state = claim(initialState(), set.posts[0])
    expect(claimReward(state, daily).xp).toBe(state.xp)
    state = claim(claim(state, set.posts[1]), set.posts[2])
    const paid = claimReward(state, daily)
    expect(paid.xp).toBe(state.xp + daily.rewardXp)
    expect(claimReward(paid, daily).xp).toBe(paid.xp)
  })

  it('never pays XP for a reported outcome', () => {
    const claimed = claim(initialState(), strong)
    expect(recordOutcome(claimed, strong).xp).toBe(claimed.xp)
    expect(recordOutcome(initialState(), strong).outcomes).toHaveLength(0)
  })

  it('does not let a claimed post be dismissed', () => {
    const claimed = claim(initialState(), strong)
    expect(dismiss(claimed, strong).dismissed).toHaveLength(0)
  })

  it('computes level standing from the product curve', () => {
    expect(standing(0, cumulative).level).toBe(1)
    expect(standing(99, cumulative).level).toBe(1)
    expect(standing(100, cumulative).level).toBe(2)
    expect(standing(283, cumulative).level).toBe(3)
    expect(standing(100, cumulative).toNext).toBe(183)
  })
})

describe('sample data', () => {
  it('labels every handle as a sample and keeps X-only', () => {
    for (const sampleSet of SAMPLE_SETS) {
      for (const post of sampleSet.posts) {
        expect(post.handle.startsWith('@sample_')).toBe(true)
      }
    }
  })

  it('teaches both sides of the XP line and an ignore in every set', () => {
    for (const sampleSet of SAMPLE_SETS) {
      const scores = sampleSet.posts.map((post) => post.score)
      expect(scores.some((score) => score >= CLAIM_MIN_SCORE)).toBe(true)
      expect(scores.some((score) => score < 40)).toBe(true)
    }
  })
})
