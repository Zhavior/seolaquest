import { describe, it, expect } from 'vitest'
import { EventRegistry, OpportunityEngagedPayloadSchema } from '../EventRegistry'

describe('EventRegistry', () => {
  it('registers and retrieves event contracts', () => {
    EventRegistry.register({
      type: 'test.event',
      version: 1,
      schema: OpportunityEngagedPayloadSchema,
    })

    const definition = EventRegistry.get('test.event', 1)
    expect(definition).toBeDefined()
    expect(definition?.type).toBe('test.event')
    expect(definition?.version).toBe(1)
  })

  it('validates canonical event payloads correctly', () => {
    const validPayload = {
      opportunityId: 'opp_123',
      leadId: 'lead_123',
      actionTaken: 'CLAIMED',
      engagedAt: new Date().toISOString(),
    }

    const validated = EventRegistry.validatePayload('opportunity.engaged', 1, validPayload)
    expect(validated.opportunityId).toBe('opp_123')
  })
})
