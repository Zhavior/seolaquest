import { describe, expect, it } from 'vitest'
import { EventFactory } from '../../core/events/EventFactory'
import { DeterministicGamifyRuleEngine } from '../GamifyRuleEngine'

describe('DeterministicGamifyRuleEngine', () => {
  it('evaluates only canonical Event Core contracts', () => {
    const event = EventFactory.create({
      type: 'opportunity.engaged',
      actorId: 'user_1',
      source: 'leads',
      payload: {
        opportunityId: 'opp_1',
        leadId: 'lead_1',
        auroraDecisionId: 'decision_1',
        auroraScore: 80,
        actionTaken: 'CLAIMED',
        engagedAt: '2026-08-07T12:00:00.000Z',
      },
    })

    const [rule] = new DeterministicGamifyRuleEngine().evaluate(event)

    expect(rule).toMatchObject({
      ruleId: 'opportunity_engaged',
      ruleVersion: 1,
      actorId: 'user_1',
      targetKey: 'opportunity:opp_1',
      requiresAuroraDecision: true,
      minimumAuroraScore: 60,
    })
    expect(rule.effects).toEqual([
      { kind: 'XP', amount: 25 },
      { kind: 'REPUTATION', amount: 1 },
    ])
  })

  it('does not invent rules for unknown production events', () => {
    const event = {
      id: 'evt_unknown',
      type: 'quest.completed',
      version: 1,
      actorId: 'user_1',
      occurredAt: '2026-08-07T12:00:00.000Z',
      source: 'test',
      correlationId: 'corr_1',
      idempotencyKey: 'unknown:user_1:corr_1',
      payload: {},
    }

    expect(new DeterministicGamifyRuleEngine().evaluate(event)).toEqual([])
  })
})
