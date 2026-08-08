import { describe, expect, it } from 'vitest'
import { EventFactory } from '../EventFactory'
import { DeterministicGamifyRuleEngine } from '../../../gamify/GamifyRuleEngine'

describe('Gamify controlled Event Core integration', () => {
  it('uses canonical lead.converted events without modifying Event Core contracts', () => {
    const event = EventFactory.create({
      type: 'lead.converted',
      actorId: 'user_1',
      source: 'leads',
      payload: {
        leadId: 'lead_1',
        opportunityId: 'opp_1',
        conversionType: 'QUALIFIED_LEAD',
        revenueValue: 2500,
        convertedAt: '2026-08-07T12:00:00.000Z',
      },
    })

    const [rule] = new DeterministicGamifyRuleEngine().evaluate(event)

    expect(rule.ruleId).toBe('lead_converted')
    expect(rule.targetKey).toBe('lead:lead_1')
    expect(rule.effects).toContainEqual({ kind: 'XP', amount: 100 })
    expect(rule.effects).toContainEqual({ kind: 'REPUTATION', amount: 5 })
  })
})
