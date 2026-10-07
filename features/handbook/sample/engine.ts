import { CLAIM_MIN_SCORE, CLAIM_XP } from '../rules'
import type { SamplePost, SampleSet } from './data'

/**
 * The sample hunt's rules, as pure functions so they can be tested without a
 * browser. They mirror what the signed-in product does, and say so where they
 * deliberately do not:
 *   - a scan costs 1 mana (credit);
 *   - claiming a lead pays CLAIM_XP only when its score reaches CLAIM_MIN_SCORE;
 *   - one award per post, so claiming twice pays once (here: cannot claim twice);
 *   - quest progress counts every claim, paid or not; the quest's own reward is
 *     collected separately once its target is met;
 *   - reporting an outcome earns nothing.
 */

export const SAMPLE_START_MANA = 3

export type SampleQuest = {
  code: 'first_contact' | 'daily_patrol'
  title: string
  target: number
  rewardXp: number
}

export type SampleState = {
  mana: number
  xp: number
  scanned: string[]
  claimed: string[]
  dismissed: string[]
  rewardsClaimed: string[]
  outcomes: string[]
  log: string
}

export function initialState(): SampleState {
  return {
    mana: SAMPLE_START_MANA,
    xp: 0,
    scanned: [],
    claimed: [],
    dismissed: [],
    rewardsClaimed: [],
    outcomes: [],
    log: 'Pick a watch list, then scan. A scan costs 1 mana.',
  }
}

export function canScan(state: SampleState): boolean {
  return state.mana > 0
}

export function scan(state: SampleState, set: SampleSet): SampleState {
  if (!canScan(state)) return { ...state, log: 'Out of sample mana. Real mana comes with a paid plan.' }
  return {
    ...state,
    mana: state.mana - 1,
    scanned: state.scanned.includes(set.id) ? state.scanned : [...state.scanned, set.id],
    log: `Scan complete: ${set.posts.length} matches kept, ${set.dropped.length} dropped as noise. That cost 1 mana and paid no XP.`,
  }
}

export function claimPays(post: SamplePost): boolean {
  return post.score >= CLAIM_MIN_SCORE
}

export function claim(state: SampleState, post: SamplePost): SampleState {
  if (state.claimed.includes(post.id)) return { ...state, log: 'Already claimed. One award per post.' }
  const pays = claimPays(post)
  return {
    ...state,
    xp: state.xp + (pays ? CLAIM_XP : 0),
    claimed: [...state.claimed, post.id],
    log: pays
      ? `Claimed ${post.handle}. Score ${post.score} clears ${CLAIM_MIN_SCORE}, so +${CLAIM_XP} XP.`
      : `Claimed ${post.handle}. Score ${post.score} is under ${CLAIM_MIN_SCORE}: saved for follow-up, +0 XP.`,
  }
}

export function dismiss(state: SampleState, post: SamplePost): SampleState {
  if (state.dismissed.includes(post.id) || state.claimed.includes(post.id)) return state
  return { ...state, dismissed: [...state.dismissed, post.id], log: `Dismissed ${post.handle}. No XP either way.` }
}

export function recordOutcome(state: SampleState, post: SamplePost): SampleState {
  if (!state.claimed.includes(post.id) || state.outcomes.includes(post.id)) return state
  return {
    ...state,
    outcomes: [...state.outcomes, post.id],
    log: 'Outcome recorded. Reported replies and sales are your own notes and earn no XP.',
  }
}

export const SAMPLE_QUESTS: SampleQuest[] = [
  { code: 'first_contact', title: 'First lead saved', target: 1, rewardXp: 50 },
  { code: 'daily_patrol', title: 'Daily Patrol', target: 3, rewardXp: 40 },
]

export function questProgress(state: SampleState, quest: SampleQuest): number {
  return Math.min(quest.target, state.claimed.length)
}

export function questReady(state: SampleState, quest: SampleQuest): boolean {
  return questProgress(state, quest) >= quest.target && !state.rewardsClaimed.includes(quest.code)
}

export function claimReward(state: SampleState, quest: SampleQuest): SampleState {
  if (!questReady(state, quest)) return state
  return {
    ...state,
    xp: state.xp + quest.rewardXp,
    rewardsClaimed: [...state.rewardsClaimed, quest.code],
    log: `${quest.title} complete: +${quest.rewardXp} XP.`,
  }
}

export type LevelStanding = {
  level: number
  intoLevel: number
  span: number
  toNext: number
}

/** Level from lifetime XP using the product's cumulative table. */
export function standing(xp: number, cumulative: readonly number[]): LevelStanding {
  let level = 1
  while (level < cumulative.length && cumulative[level] <= xp) level += 1
  const floor = cumulative[level - 1] ?? 0
  const ceiling = cumulative[level] ?? floor
  const span = Math.max(1, ceiling - floor)
  return { level, intoLevel: xp - floor, span, toNext: Math.max(0, ceiling - xp) }
}
