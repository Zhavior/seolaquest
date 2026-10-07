import { GamifyLevelCurve } from '@/src/modules/gamify/GamifyLevelCurve'
import { DeterministicGamifyRuleEngine } from '@/src/modules/gamify/GamifyRuleEngine'
import type { GamifyRuleEvaluation } from '@/src/modules/gamify/types'

/**
 * The game rules the public site talks about, read from the same modules the
 * signed-in product runs. Nothing here is a marketing number: the XP amounts
 * and score line come out of the real rule engine, the level table out of the
 * real curve, and the quest list out of the real catalog. If a rule changes in
 * the product, this page changes with it, and `contract.test.ts` fails if the
 * two ever stop agreeing on the pieces that are not importable.
 */

const engine = new DeterministicGamifyRuleEngine()

function probe(type: string, payload: Record<string, unknown>): GamifyRuleEvaluation {
  const [rule] = engine.evaluate({
    id: '00000000-0000-4000-8000-000000000000',
    type,
    version: 1,
    actorId: 'handbook-preview',
    occurredAt: new Date(0).toISOString(),
    source: 'handbook.rules',
    correlationId: 'handbook-preview',
    idempotencyKey: 'handbook-preview',
    payload,
  })
  if (!rule) throw new Error(`The rule engine has no rule for "${type}"`)
  return rule
}

function xpOf(rule: GamifyRuleEvaluation): number {
  const effect = rule.effects.find((candidate) => candidate.kind === 'XP')
  if (!effect) throw new Error(`Rule "${rule.ruleId}" pays no XP`)
  return effect.amount
}

const claimRule = probe('opportunity.engaged', { opportunityId: 'preview' })
const feedbackRule = probe('aurora.feedback.recorded', { feedbackType: 'ENGAGED', decisionId: 'preview' })

/** XP paid when a lead scored at or above CLAIM_MIN_SCORE is claimed. */
export const CLAIM_XP = xpOf(claimRule)
/** Aurora score a lead must reach before claiming it pays XP. */
export const CLAIM_MIN_SCORE = claimRule.minimumAuroraScore ?? 0
/** XP paid for recording useful Aurora feedback. */
export const FEEDBACK_XP = xpOf(feedbackRule)

/**
 * Not importable from the product (they are inline in the scorer and the
 * eligibility policy), so they are pinned here and checked against the source
 * text by contract.test.ts.
 */
export const AURORA_ENGAGE_MIN = 80
export const AURORA_IGNORE_BELOW = 40
export const DAILY_XP_CAP = 500

export type Tier = 'ENGAGE' | 'WATCH' | 'IGNORE'

export function tierForScore(score: number): Tier {
  if (score >= AURORA_ENGAGE_MIN) return 'ENGAGE'
  if (score < AURORA_IGNORE_BELOW) return 'IGNORE'
  return 'WATCH'
}

export type LevelRow = { level: number; cumulativeXp: number; nextStep: number }

/** Levels 1..max with cumulative XP, straight from the curve. */
export function levelTable(max = 10): LevelRow[] {
  const rows: LevelRow[] = []
  for (let level = 1; level <= max; level += 1) {
    const cumulativeXp = GamifyLevelCurve.cumulativeXpRequiredForLevel(level)
    const next = GamifyLevelCurve.cumulativeXpRequiredForLevel(level + 1)
    rows.push({ level, cumulativeXp, nextStep: next - cumulativeXp })
  }
  return rows
}
