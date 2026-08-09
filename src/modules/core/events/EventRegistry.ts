import { z } from 'zod'
import { ValidationError } from '@/src/modules/core/infrastructure/errors'

export interface EventDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
  type: string
  version: number
  schema: T
}

// Canonical Event Payload Schemas
export const OpportunityDiscoveredPayloadSchema = z.object({
  opportunityId: z.string().min(1),
  leadId: z.string().min(1),
  keywordId: z.string().min(1),
  keywordPhrase: z.string().min(1),
  platform: z.string().min(1),
  externalPostId: z.string().min(1),
  author: z.string(),
  content: z.string().min(1),
  url: z.string().url(),
  sourceCreatedAt: z.string().optional(),
})

export const OpportunityEngagedPayloadSchema = z.object({
  opportunityId: z.string().min(1),
  leadId: z.string().min(1),
  auroraDecisionId: z.string().optional(),
  auroraScore: z.number().int().min(0).max(100).optional(),
  actionTaken: z.string().default('CLAIMED'),
  engagedAt: z.string().datetime(),
})

export const OpportunityDismissedPayloadSchema = z.object({
  opportunityId: z.string().min(1),
  leadId: z.string().min(1),
  dismissedAt: z.string().datetime(),
})

export const LeadConvertedPayloadSchema = z.object({
  leadId: z.string().min(1),
  opportunityId: z.string().min(1),
  conversionType: z.string().default('QUALIFIED_LEAD'),
  revenueValue: z.number().nonnegative().optional(),
  convertedAt: z.string().datetime(),
})

export const AuroraEvaluatedPayloadSchema = z.object({
  decisionId: z.string().min(1),
  opportunityId: z.string().min(1),
  leadId: z.string().min(1).optional(),
  finalScore: z.number().int().min(0).max(100),
  confidence: z.number().min(0).max(100),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  recommendedAction: z.enum(['IGNORE', 'WATCH', 'ENGAGE']),
  reasons: z.array(z.string()),
})

export const AuroraFeedbackRecordedPayloadSchema = z.object({
  feedbackId: z.string().min(1),
  decisionId: z.string().min(1),
  feedbackType: z.enum(['DISMISSED', 'SAVED', 'ENGAGED', 'REPLIED', 'QUALIFIED', 'CONVERTED', 'MANUAL_OVERRIDE']),
  source: z.string().min(1),
  correction: z.record(z.unknown()).nullable().optional(),
})

export class EventRegistry {
  private static registry = new Map<string, EventDefinition>()

  static register<T extends z.ZodTypeAny>(definition: EventDefinition<T>): void {
    const key = `${definition.type}:v${definition.version}`
    this.registry.set(key, definition)
  }

  static get(type: string, version: number): EventDefinition | undefined {
    return this.registry.get(`${type}:v${version}`)
  }

  static validatePayload(type: string, version: number, payload: unknown): Record<string, unknown> {
    const definition = this.get(type, version)
    if (!definition) {
      throw new ValidationError(`Unregistered event contract '${type}' (version ${version})`)
    }
    const result = definition.schema.safeParse(payload)
    if (!result.success) {
      throw new ValidationError(`Invalid payload for event contract '${type}:v${version}'`, result.error.issues)
    }
    return result.data as Record<string, unknown>
  }
}

// Register canonical domain events
EventRegistry.register({ type: 'opportunity.discovered', version: 1, schema: OpportunityDiscoveredPayloadSchema })
EventRegistry.register({ type: 'opportunity.engaged', version: 1, schema: OpportunityEngagedPayloadSchema })
EventRegistry.register({ type: 'opportunity.dismissed', version: 1, schema: OpportunityDismissedPayloadSchema })
EventRegistry.register({ type: 'lead.converted', version: 1, schema: LeadConvertedPayloadSchema })
EventRegistry.register({ type: 'aurora.opportunity.evaluated', version: 1, schema: AuroraEvaluatedPayloadSchema })
EventRegistry.register({ type: 'aurora.feedback.recorded', version: 1, schema: AuroraFeedbackRecordedPayloadSchema })
