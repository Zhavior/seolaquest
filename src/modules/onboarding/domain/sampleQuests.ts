/**
 * Seeded tutorial signals, written once at the end of first-run setup.
 *
 * A brand new account has an empty queue until the first real scan sweep lands,
 * and an empty queue teaches a hunter nothing about sorting, claiming, or
 * replying. These three rows make the whole loop reviewable on day one.
 *
 * Every field is written to be unmistakably a sample. `DEFAULT_DEMO_LEADS` in
 * the dashboard is deliberately empty because fabricated rows must never be
 * mistaken for source data — these rows honour the same rule by labelling
 * themselves in the platform chip, the author, and the body copy, and by
 * pointing at an in-app page rather than a fabricated external permalink.
 */

/** Platform chip the feed renders for a seeded row. */
export const SAMPLE_QUEST_PLATFORM = 'SAMPLE'

/** Prefix every seeded body carries so it reads as a sample even out of context. */
export const SAMPLE_QUEST_LABEL = '[TUTORIAL TARGET — HIGH INTENT]'

/**
 * Seeded rows link here instead of to a source thread. A fabricated permalink
 * would either 404 or, worse, resolve to an unrelated real post.
 */
export const SAMPLE_QUEST_URL = '/app/keywords'

/** Stable per-user ids, so re-running setup can never duplicate the samples. */
const SAMPLE_QUEST_IDS = [
  'sample-quest:high-intent',
  'sample-quest:comparison',
  'sample-quest:switching',
] as const

export type SampleQuest = {
  externalPostId: string
  platform: string
  author: string
  content: string
  matched: string
  url: string
}

/**
 * The first keyword the hunter chose, trimmed for display inside sample copy.
 * A very long phrase would otherwise dominate the card and hide the label.
 */
function forDisplay(phrase: string) {
  const clean = phrase.replace(/\s+/g, ' ').trim()
  return clean.length > 60 ? `${clean.slice(0, 59)}…` : clean
}

export function buildSampleQuests(keywordPhrase: string): SampleQuest[] {
  const phrase = forDisplay(keywordPhrase)

  const bodies = [
    `${SAMPLE_QUEST_LABEL} Sample signal — not a real person. This is what a high-intent match looks like: someone asking their network for a recommendation and naming a budget. Claim it to see the reply flow and earn XP.`,
    `${SAMPLE_QUEST_LABEL} Sample signal — not a real person. A comparison post: they are weighing two options out loud and have not decided yet. Use it to try sorting and filtering the queue.`,
    `${SAMPLE_QUEST_LABEL} Sample signal — not a real person. A switching post: they are unhappy with what they use now. Dismiss this one to see how the queue clears.`,
  ]

  return SAMPLE_QUEST_IDS.map((externalPostId, index) => ({
    externalPostId,
    platform: SAMPLE_QUEST_PLATFORM,
    author: `Tutorial Target 0${index + 1}`,
    content: bodies[index],
    matched: phrase,
    url: SAMPLE_QUEST_URL,
  }))
}

export function isSampleQuest(lead: { platform: string }) {
  return lead.platform.toUpperCase() === SAMPLE_QUEST_PLATFORM
}
