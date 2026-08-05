/**
 * Starter keywords, framed as weapons to equip during the tutorial quest.
 *
 * A blank keyword box is the hardest moment in setup: it asks a brand new
 * hunter to guess what a good search looks like before they have ever seen a
 * result. Each preset is a real buying-intent pattern, so picking one is a
 * shortcut to a working hunt rather than a toy.
 */

export type KeywordPreset = {
  id: string
  name: string
  emoji: string
  /** Dropped straight into the keyword field. */
  phrase: string
  /**
   * True when the phrase is a stem the hunter must finish (a competitor name,
   * say). The form focuses the field and parks the caret at the end.
   */
  needsCompletion?: boolean
  /** Plain description of who this actually finds. No lore here — it has to be useful. */
  hint: string
}

export const KEYWORD_PRESETS: KeywordPreset[] = [
  {
    id: 'recommendation-blade',
    name: 'Recommendation Blade',
    emoji: '⚔️',
    phrase: 'can anyone recommend',
    hint: 'People asking their network for a referral right now.',
  },
  {
    id: 'alternative-arrow',
    name: 'Alternative Arrow',
    emoji: '🏹',
    phrase: 'alternative to ',
    needsCompletion: true,
    hint: 'Add a competitor. Finds people already shopping for a replacement.',
  },
  {
    id: 'frustration-hammer',
    name: 'Frustration Hammer',
    emoji: '🔨',
    phrase: 'frustrated with',
    hint: 'People venting about a tool they still pay for.',
  },
  {
    id: 'switching-shield',
    name: 'Switching Shield',
    emoji: '🛡️',
    phrase: 'thinking of switching',
    hint: 'People mid-decision, before they have committed.',
  },
  {
    id: 'budget-orb',
    name: 'Budget Orb',
    emoji: '🔮',
    phrase: 'is it worth the money',
    hint: 'People weighing a purchase out loud.',
  },
  {
    id: 'hiring-dagger',
    name: 'Hiring Dagger',
    emoji: '🗡️',
    phrase: 'looking to hire',
    hint: 'Teams that already have budget approved.',
  },
]
