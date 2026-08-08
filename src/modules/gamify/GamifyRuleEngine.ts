import type { DomainEvent } from '../core/events/DomainEvent'
import type { GamifyRuleEvaluation } from './types'

const RULE_VERSION = 1

function stringPayloadValue(event: DomainEvent, key: string): string | null {
  const value = event.payload[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export class DeterministicGamifyRuleEngine {
  evaluate(event: DomainEvent): GamifyRuleEvaluation[] {
    switch (event.type) {
      case 'opportunity.discovered': {
        const opportunityId = stringPayloadValue(event, 'opportunityId')
        if (!opportunityId) return []

        return [{
          ruleId: 'opportunity_discovered',
          ruleVersion: RULE_VERSION,
          sourceEventId: event.id,
          actorId: event.actorId,
          targetKey: `opportunity:${opportunityId}`,
          reason: 'Opportunity discovered',
          effects: [{ kind: 'XP', amount: 10 }],
          requiresAuroraDecision: false,
        }]
      }

      case 'opportunity.engaged': {
        const opportunityId = stringPayloadValue(event, 'opportunityId')
        if (!opportunityId) return []

        return [{
          ruleId: 'opportunity_engaged',
          ruleVersion: RULE_VERSION,
          sourceEventId: event.id,
          actorId: event.actorId,
          targetKey: `opportunity:${opportunityId}`,
          reason: 'Qualified opportunity engaged',
          effects: [
            { kind: 'XP', amount: 25 },
            { kind: 'REPUTATION', amount: 1 },
          ],
          requiresAuroraDecision: true,
          minimumAuroraScore: 60,
        }]
      }

      case 'lead.converted': {
        const leadId = stringPayloadValue(event, 'leadId')
        if (!leadId) return []

        return [{
          ruleId: 'lead_converted',
          ruleVersion: RULE_VERSION,
          sourceEventId: event.id,
          actorId: event.actorId,
          targetKey: `lead:${leadId}`,
          reason: 'Lead converted',
          effects: [
            { kind: 'XP', amount: 100 },
            { kind: 'REPUTATION', amount: 5 },
          ],
          requiresAuroraDecision: true,
          minimumAuroraScore: 50,
        }]
      }

      case 'aurora.feedback.recorded': {
        const feedbackType = stringPayloadValue(event, 'feedbackType')
        const decisionId = stringPayloadValue(event, 'decisionId')
        if (!decisionId || !['ENGAGED', 'QUALIFIED', 'CONVERTED'].includes(feedbackType ?? '')) return []

        return [{
          ruleId: 'aurora_feedback_quality',
          ruleVersion: RULE_VERSION,
          sourceEventId: event.id,
          actorId: event.actorId,
          targetKey: `aurora-decision:${decisionId}`,
          reason: 'Useful Aurora feedback recorded',
          effects: [{ kind: 'XP', amount: 5 }],
          requiresAuroraDecision: false,
        }]
      }

      default:
        return []
    }
  }
}
