import { LAST_ONBOARDING_STEP } from './onboarding'

/**
 * Setup presented as a tutorial quest.
 *
 * The step numbers and the server's `onboardingStep` are the same thing — this
 * only supplies the framing, so the quest log can never drift out of sync with
 * what the database will actually accept.
 */

export type QuestObjective = {
  step: number
  /** Short label for the quest log rail. */
  label: string
  /** The step's heading. */
  title: string
  /** What this objective is for, in plain terms. */
  objective: string
  optional?: boolean
}

export const QUEST_OBJECTIVES: QuestObjective[] = [
  {
    step: 1,
    label: 'Hunter',
    title: 'Name your hunter',
    objective: 'Pick the name and sigil your workspace will carry.',
  },
  {
    step: 2,
    label: 'Trade',
    title: 'Declare your trade',
    objective: 'Say what you sell, so the hunt knows what counts as a win.',
    optional: true,
  },
  {
    step: 3,
    label: 'Quarry',
    title: 'Mark your quarry',
    objective: 'Describe the customer worth chasing.',
    optional: true,
  },
  {
    step: 4,
    label: 'Weapon',
    title: 'Equip your first weapon',
    objective: 'Choose a keyword. This is what the hunt actually searches for.',
  },
  {
    step: 5,
    label: 'Grounds',
    title: 'Choose your hunting ground',
    objective: 'Pick the source to sweep for signals.',
  },
  {
    step: 6,
    label: 'Contract',
    title: 'Sign the contract',
    objective: 'Review what setup will and will not do, then claim your reward.',
  },
]

export const QUEST_TITLE = 'Tutorial quest — the first hunt'

/** Paid on completion by the server, in one transaction with the keyword. */
export const QUEST_XP_REWARD = 50

export function objectiveForStep(step: number): QuestObjective {
  return QUEST_OBJECTIVES[Math.min(Math.max(step, 1), LAST_ONBOARDING_STEP) - 1]
}
