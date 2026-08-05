/**
 * One implementation of the XP curve, shared by every action that rewards a
 * hunter. Progression is displayed in the shell HUD on every request, so two
 * copies of this maths would eventually disagree and show a level the database
 * does not hold.
 *
 * `xp` is progress *inside* the current level, not a lifetime total, and
 * `xpRequired` is the current level's bar. That is the shape the `User` columns
 * already store.
 */

export type ProgressionState = {
  xp: number
  level: number
  xpRequired: number
  xpMultiplier?: number
}

export type ProgressionResult = {
  xp: number
  level: number
  xpRequired: number
  xpMultiplier: number
  didLevelUp: boolean
  levelsGained: number
}

/** Reward for turning a signal into an outbound reply. */
export const XP_PER_CLAIMED_QUEST = 10

/**
 * Reward for finishing first-run setup. Deliberately large enough to move the
 * HUD bar visibly on the very first visit — a bar that never moves reads as a
 * decoration rather than a real meter.
 */
export const XP_FIRST_QUEST_BONUS = 50

const LEVEL_CURVE_MULTIPLIER = 1.5

/**
 * A single award must never climb more levels than this. It bounds the loop
 * against a corrupt `xpRequired` (zero or negative) rather than trusting the
 * row to be sane, because this runs inside a row-locked transaction.
 */
const MAX_LEVELS_PER_AWARD = 50

const DEFAULT_XP_REQUIRED = 100

export function applyXpGain(state: ProgressionState, amount: number): ProgressionResult {
  let level = Number.isFinite(state.level) && state.level > 0 ? Math.floor(state.level) : 1
  let xp = Number.isFinite(state.xp) && state.xp > 0 ? Math.floor(state.xp) : 0
  let xpRequired =
    Number.isFinite(state.xpRequired) && state.xpRequired > 0
      ? Math.floor(state.xpRequired)
      : DEFAULT_XP_REQUIRED

  const award = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0
  xp += award

  let levelsGained = 0
  while (xp >= xpRequired && levelsGained < MAX_LEVELS_PER_AWARD) {
    level += 1
    xp -= xpRequired
    xpRequired = Math.floor(xpRequired * LEVEL_CURVE_MULTIPLIER)
    levelsGained += 1
  }

  const xpMultiplier = Number((1.0 + (level - 1) * 0.1).toFixed(2))

  return { xp, level, xpRequired, xpMultiplier, didLevelUp: levelsGained > 0, levelsGained }
}
