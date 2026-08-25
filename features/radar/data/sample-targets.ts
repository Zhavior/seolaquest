/**
 * Sample data for the public radar simulator.
 *
 * Every record here is invented for demonstration and is labelled as such on
 * the page. Nothing in this file is a customer, a captured thread, or a
 * measured result — the simulator exists to show the shape of the workflow, so
 * it must never be read as evidence that the workflow has produced outcomes.
 */

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

export type SampleTarget = {
  id: string
  source: 'X' | 'Reddit'
  handle: string
  avatar: string
  title: string
  body: string
  competitor: string
  painPoint: string
  /** Demo score, 0-100. Not a model output. */
  intentScore: number
  rarity: Rarity
  timestamp: string
  suggestedReply: string
  /** Blip placement on the scope: compass bearing in degrees. */
  bearing: number
  /** Blip placement on the scope: 0 = centre, 1 = outer ring. */
  range: number
}

export const PREY_LIST = ['Salesforce', 'HubSpot', 'Notion', 'Airtable', 'Jira', 'Zendesk'] as const
export type Prey = (typeof PREY_LIST)[number]

export const PAIN_LIST = [
  'Pricing revolt',
  'Urgent migration',
  'Missing feature',
  'Downtime rage',
  'Support ghosting',
] as const
export type Pain = (typeof PAIN_LIST)[number]

export type ActionId = 'reply' | 'dm' | 'webhook' | 'export'

export const ACTION_LIST: ReadonlyArray<{ id: ActionId; label: string; outputLabel: string }> = [
  { id: 'reply', label: 'Draft a public reply', outputLabel: 'Draft reply' },
  { id: 'dm', label: 'Draft a direct message', outputLabel: 'Draft DM' },
  { id: 'webhook', label: 'Send to a webhook', outputLabel: 'Webhook payload' },
  { id: 'export', label: 'Export the row', outputLabel: 'Exported row (CSV)' },
]

export const SAMPLE_TARGETS: SampleTarget[] = [
  {
    id: 'sample-1',
    source: 'Reddit',
    handle: 'u/sample_growth_lead',
    avatar: '🧙',
    title: 'Moving off Salesforce after the latest price change',
    body: 'Eighty-person consultancy. The per-seat cost stopped making sense for how little of the product we actually use. Looking for something API-first we can wire into our own data.',
    competitor: 'Salesforce',
    painPoint: 'Pricing revolt',
    intentScore: 96,
    rarity: 'LEGENDARY',
    timestamp: 'demo thread',
    suggestedReply:
      'The per-seat model is what got us too — most of the seats were read-only. If you want the data in your own Postgres instead of behind a UI, it is worth checking what the export and webhook story looks like before you commit to a migration window.',
    bearing: 42,
    range: 0.55,
  },
  {
    id: 'sample-2',
    source: 'X',
    handle: '@sample_cto_builds',
    avatar: '⚡',
    title: 'HubSpot onboarding has taken three weeks and we ship Friday',
    body: 'Still waiting on migration verification. Has anyone moved a mid-size workspace over in under a week without a vendor call?',
    competitor: 'HubSpot',
    painPoint: 'Urgent migration',
    intentScore: 91,
    rarity: 'EPIC',
    timestamp: 'demo thread',
    suggestedReply:
      'If the blocker is verification rather than the data itself, ask for a sandbox workspace so you can run the import against real records while the paperwork finishes. That unblocked the same deadline for us.',
    bearing: 214,
    range: 0.7,
  },
  {
    id: 'sample-3',
    source: 'Reddit',
    handle: 'u/sample_founder',
    avatar: '⚔️',
    title: 'Notion search is slowing down across a 40-doc workspace',
    body: 'Formula properties keep timing out once relations get deep. We want something built for structured lookups rather than documents.',
    competitor: 'Notion',
    painPoint: 'Missing feature',
    intentScore: 84,
    rarity: 'RARE',
    timestamp: 'demo thread',
    suggestedReply:
      'Relation-heavy formulas are usually the first thing to fall over. Splitting the lookup tables out into a real database and keeping docs as docs is less work than it sounds, and it makes the slow queries measurable.',
    bearing: 305,
    range: 0.44,
  },
  {
    id: 'sample-4',
    source: 'X',
    handle: '@sample_martech',
    avatar: '🏹',
    title: 'Hit the Airtable record ceiling in production',
    body: 'We need relational integrity without jumping to the tier that prices it as an add-on. Open to anything with a real query layer.',
    competitor: 'Airtable',
    painPoint: 'Pricing revolt',
    intentScore: 88,
    rarity: 'EPIC',
    timestamp: 'demo thread',
    suggestedReply:
      'The record ceiling is usually a signal that the data outgrew the spreadsheet model rather than the plan. Worth pricing a managed Postgres against the upgrade before you renew — it was cheaper for us at that size.',
    bearing: 128,
    range: 0.82,
  },
  {
    id: 'sample-5',
    source: 'Reddit',
    handle: 'u/sample_ops_lead',
    avatar: '🛡️',
    title: 'Third Jira outage this quarter during our release window',
    body: 'Support acknowledged it days later. Looking for a tracker that publishes an honest status history.',
    competitor: 'Jira',
    painPoint: 'Downtime rage',
    intentScore: 79,
    rarity: 'RARE',
    timestamp: 'demo thread',
    suggestedReply:
      'Ask any replacement for their raw incident history rather than the uptime badge — the badge is usually calculated after the fact. A public postmortem trail tells you far more than a number on a marketing page.',
    bearing: 265,
    range: 0.33,
  },
]

/** Pain filters offered above the scope, in display order. */
export const SCOPE_FILTERS = ['All', 'Pricing revolt', 'Urgent migration', 'Missing feature', 'Downtime rage'] as const

/**
 * Written examples of the posts the filter is built to drop.
 *
 * These are the other half of the sample set: the simulator's rejected count is
 * derived from these rows plus the sample threads that do not match the chosen
 * tool and complaint, so the number on screen describes something that actually
 * exists on this page rather than a made-up scan volume.
 */
export const NOISE_SAMPLES: ReadonlyArray<{ who: string; text: string; why: string }> = [
  {
    who: 'promo account',
    text: 'Follow and repost to win a spot in the drop.',
    why: 'Promotion, not a problem',
  },
  {
    who: 'reply bot',
    text: 'Great post! Thanks for sharing this valuable overview!',
    why: 'Automated engagement',
  },
  {
    who: 'engagement bait',
    text: 'Happy Monday — what is your favourite CRM? Drop it below.',
    why: 'No stated problem',
  },
]

/** Total rows the simulator can consider in one scan. */
export const SAMPLE_ROW_COUNT = SAMPLE_TARGETS.length + NOISE_SAMPLES.length

/**
 * How many sample rows a given tool/complaint pair discards: every noise row,
 * plus every thread about a different tool or a different complaint.
 */
export function rejectedRowCount(prey: Prey, pain: Pain): number {
  const kept = SAMPLE_TARGETS.filter(
    (target) => target.competitor === prey && target.painPoint === pain,
  ).length
  return SAMPLE_ROW_COUNT - kept
}

/** The stored record for a target, as the raw-JSON view shows it. */
export function rawRecord(target: SampleTarget): string {
  return JSON.stringify(
    {
      sample: true,
      source_url: null,
      id: target.id,
      source: target.source,
      handle: target.handle,
      competitor: target.competitor,
      pain_point: target.painPoint,
      demo_score: target.intentScore,
      rarity: target.rarity,
      title: target.title,
      body: target.body,
    },
    null,
    2,
  )
}
