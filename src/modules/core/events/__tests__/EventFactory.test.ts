import { describe, it, expect } from 'vitest'
import { EventFactory } from '../EventFactory'
import { ValidationError } from '@/src/modules/core/infrastructure/errors'

describe('EventFactory', () => {
  it('creates a valid canonical DomainEvent envelope', () => {
    const event = EventFactory.create({
      type: 'opportunity.discovered',
      version: 1,
      actorId: 'user_123',
      source: 'leads.scan_service',
      payload: {
        opportunityId: 'opp_123',
        leadId: 'lead_123',
        keywordId: 'kw_123',
        keywordPhrase: 'seo tools',
        platform: 'reddit',
        externalPostId: 'post_123',
        author: 'seo_expert',
        content: 'Looking for the best SEO tool for small business',
        url: 'https://reddit.com/r/seo/comments/123',
      },
    })

    expect(event.id).toBeDefined()
    expect(event.type).toBe('opportunity.discovered')
    expect(event.version).toBe(1)
    expect(event.actorId).toBe('user_123')
    expect(event.source).toBe('leads.scan_service')
    expect(event.correlationId).toBe(event.id)
    expect(event.idempotencyKey).toBe(`opportunity.discovered:user_123:${event.correlationId}`)
    expect(event.payload.opportunityId).toBe('opp_123')
  })

  it('rejects unregistered event contracts', () => {
    expect(() =>
      EventFactory.create({
        type: 'unregistered.event.type',
        version: 1,
        actorId: 'user_123',
        source: 'test',
        payload: { foo: 'bar' },
      })
    ).toThrow(ValidationError)
  })

  it('rejects payload schema mismatches', () => {
    expect(() =>
      EventFactory.create({
        type: 'opportunity.discovered',
        version: 1,
        actorId: 'user_123',
        source: 'test',
        payload: {
          opportunityId: 'opp_123',
          // missing required leadId, url, etc.
        },
      })
    ).toThrow(ValidationError)
  })
})
