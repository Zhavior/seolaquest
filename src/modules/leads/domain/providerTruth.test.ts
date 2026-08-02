import { describe, expect, it } from 'vitest'
import {
  aggregateProviderAttempts,
  MalformedProviderResponseError,
  parseRedditPayload,
  parseXPayload,
  rateLimitResetAt,
} from './providerTruth'

const now = new Date('2026-08-01T12:00:00.000Z')

describe('provider truth validation', () => {
  it('normalizes schema-valid Reddit and X records', () => {
    expect(parseRedditPayload({ data: { children: [{ data: {
      name: 't3_one',
      permalink: '/r/saas/comments/one',
      title: ' Need   a CRM ',
      selftext: '',
      author: 'buyer',
      created_utc: now.getTime() / 1_000,
    } }] } }, now)).toEqual([expect.objectContaining({
      externalPostId: 't3_one',
      content: 'Need a CRM',
      author: 'u/buyer',
      sourceCreatedAt: now,
    })])

    expect(parseXPayload({ data: [{
      id: '42', text: 'Need a pipeline', author_id: '7', created_at: now.toISOString(),
    }] }, now)).toEqual([expect.objectContaining({
      externalPostId: 'tw_42', author: 'x-user:7', sourceCreatedAt: now,
    })])
  })

  it.each([
    new Date(now.getTime() + 6 * 60_000),
    new Date(now.getTime() - 91 * 24 * 60 * 60_000),
  ])('rejects impossible source timestamp %s', (sourceCreatedAt) => {
    expect(() => parseXPayload({ data: [{
      id: '42', text: 'record', created_at: sourceCreatedAt.toISOString(),
    }] }, now)).toThrow(MalformedProviderResponseError)
  })

  it('rejects a structurally malformed success body instead of treating it as zero results', () => {
    expect(() => parseRedditPayload({ data: { children: 'not-an-array' } }, now))
      .toThrow(MalformedProviderResponseError)
  })

  it('rejects non-canonical provider identifiers before building source URLs', () => {
    expect(() => parseRedditPayload({ data: { children: [{ data: {
      name: 'post-one',
      permalink: '/r/saas/comments/one',
      title: 'Need a CRM',
      created_utc: now.getTime() / 1_000,
    } }] } }, now)).toThrow(MalformedProviderResponseError)
    expect(() => parseXPayload({ data: [{
      id: '../settings', text: 'record', created_at: now.toISOString(),
    }] }, now)).toThrow(MalformedProviderResponseError)
  })

  it('parses provider retry metadata without exposing raw headers', () => {
    const headers = new Headers({ 'retry-after': '60' })
    expect(rateLimitResetAt(headers, now)).toEqual(new Date('2026-08-01T12:01:00.000Z'))
  })

  it('makes partial provider outages explicit in aggregate status', () => {
    const aggregate = aggregateProviderAttempts([
      { provider: 'REDDIT', outcome: 'ZERO_RESULTS', resultCount: 0, insertedCount: 0, rateLimitResetAt: null },
      { provider: 'X', outcome: 'RATE_LIMITED', resultCount: 0, insertedCount: 0, rateLimitResetAt: new Date('2026-08-01T12:05:00.000Z') },
    ])
    expect(aggregate.status).toBe('PARTIAL_OUTAGE')
    expect(aggregate.providers).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: 'REDDIT', zeroResults: 1 }),
      expect.objectContaining({ provider: 'X', rateLimited: 1 }),
    ]))
  })
})
