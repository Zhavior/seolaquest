import type { CreateGamifyQuestDefinition } from './GamifyQuestCatalogService'

/**
 * The shipped quest catalog.
 *
 * Every quest here pays for an *outcome* — a signal the hunter turned into
 * contact, or a lead that actually converted. Nothing pays for running a scan.
 * That is a deliberate product decision: scans cost the tenant credits, so XP
 * for scanning would reward spend rather than skill and would turn the
 * leaderboard into a ranking of who burned the most budget.
 *
 * `aurora.feedback.recorded` is a registered quest progress event and is
 * deliberately unused here. `GamifyQuestService.contributeForEvent` counts every
 * event of a matching type regardless of payload, so a feedback quest would
 * count DISMISSED alongside CONVERTED and could be farmed by dismissing signals
 * in a loop. Feedback is still rewarded — through
 * `DeterministicGamifyRuleEngine`, which reads `feedbackType` and only pays for
 * ENGAGED, QUALIFIED and CONVERTED.
 *
 * Changing `target`, `rewardXp`, `type` or the event binding of a live quest
 * requires a new `version`: an assignment snapshots the target and reward it was
 * created with, so editing them in place would leave existing hunters chasing a
 * bar the catalog no longer describes. `GamifyQuestCatalogService.syncDefinitions`
 * enforces that.
 */
export const GAMIFY_QUEST_CATALOG: CreateGamifyQuestDefinition[] = [
  {
    code: 'first_contact',
    version: 1,
    title: 'First Contact',
    description: 'Claim your first qualified signal and open a conversation with it.',
    type: 'ONBOARDING',
    eventType: 'opportunity.engaged',
    target: 1,
    rewardXp: 50,
  },
  {
    code: 'first_conversion',
    version: 1,
    title: 'First Blood',
    description: 'Turn a claimed signal into a converted lead.',
    type: 'ONBOARDING',
    eventType: 'lead.converted',
    target: 1,
    rewardXp: 200,
  },
  {
    code: 'daily_patrol',
    version: 1,
    title: 'Daily Patrol',
    description: 'Claim three signals today.',
    type: 'DAILY',
    eventType: 'opportunity.engaged',
    target: 3,
    rewardXp: 40,
  },
  {
    code: 'weekly_sweep',
    version: 1,
    title: 'Weekly Sweep',
    description: 'Claim fifteen signals this week.',
    type: 'WEEKLY',
    eventType: 'opportunity.engaged',
    target: 15,
    rewardXp: 150,
  },
  {
    code: 'weekly_closer',
    version: 1,
    title: 'Weekly Closer',
    description: 'Convert two leads this week.',
    type: 'WEEKLY',
    eventType: 'lead.converted',
    target: 2,
    rewardXp: 300,
  },
  {
    code: 'milestone_fifty_claims',
    version: 1,
    title: 'Field Veteran',
    description: 'Claim fifty signals in total.',
    type: 'MILESTONE',
    eventType: 'opportunity.engaged',
    target: 50,
    rewardXp: 500,
  },
  {
    code: 'milestone_ten_conversions',
    version: 1,
    title: 'Rainmaker',
    description: 'Convert ten leads in total.',
    type: 'MILESTONE',
    eventType: 'lead.converted',
    target: 10,
    rewardXp: 1_000,
  },
]
