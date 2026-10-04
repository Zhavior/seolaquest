import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AURORA_ENGAGE_MIN,
  AURORA_IGNORE_BELOW,
  CLAIM_MIN_SCORE,
  CLAIM_XP,
  DAILY_XP_CAP,
  FEEDBACK_XP,
  levelTable,
} from './rules'
import { questViews } from './quests'

/**
 * The public site states game rules. Most come straight out of product modules
 * (see rules.ts). The few that only exist as literals inside product code are
 * pinned here, and this test reads the product source so a change there fails
 * loudly instead of leaving the marketing page quietly wrong.
 */
const root = path.resolve(__dirname, '../..')
const read = (relative: string) => readFileSync(path.join(root, relative), 'utf8')

describe('marketing rules match the product', () => {
  it('reads the claim rule from the engine', () => {
    expect(CLAIM_XP).toBe(25)
    expect(CLAIM_MIN_SCORE).toBe(60)
    expect(FEEDBACK_XP).toBe(5)
  })

  it('pins the Aurora action thresholds to the scorer source', () => {
    const scorer = read('src/modules/aurora/classifiers/CanonicalPolicyScorer.ts')
    expect(scorer).toContain(`finalScore >= ${AURORA_ENGAGE_MIN}`)
    expect(scorer).toContain(`finalScore < ${AURORA_IGNORE_BELOW}`)
  })

  it('pins the daily XP cap to the eligibility policy', () => {
    const policy = read('src/modules/gamify/RewardEligibilityService.ts')
    expect(policy).toContain(`dailyXpCap: ${DAILY_XP_CAP}`)
  })

  it('pins the checkout gate env names to the billing service', () => {
    const billing = read('src/modules/billing/application/BillingService.ts')
    for (const name of [
      'ENABLE_BETA_CHECKOUT',
      'SUBSCRIPTION_CHECKOUT_ENABLED',
      'ENABLE_SCAN_WORKER',
      'DURABLE_WORKER_ENABLED',
    ]) {
      expect(billing).toContain(name)
    }
  })

  it('follows the product level curve', () => {
    const table = levelTable(5)
    expect(table.map((row) => row.cumulativeXp)).toEqual([0, 100, 283, 520, 800])
  })

  it('lists the suspended conversion quests as not live', () => {
    const suspended = questViews().filter((quest) => !quest.live).map((quest) => quest.code)
    expect(suspended.sort()).toEqual(['first_conversion', 'milestone_ten_conversions', 'weekly_closer'])
    const live = questViews().filter((quest) => quest.live).map((quest) => quest.code)
    expect(live.sort()).toEqual(['daily_patrol', 'first_contact', 'milestone_fifty_claims', 'weekly_sweep'])
  })
})
