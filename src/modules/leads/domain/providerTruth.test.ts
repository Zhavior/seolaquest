import { describe, expect, it } from 'vitest'
import {
  aggregateProviderAttempts,
  filterQualifiedRecords,
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

describe('filterQualifiedRecords', () => {
  const record = (over: Partial<{ externalPostId: string; author: string; content: string }>) => ({
    externalPostId: 'tw_1',
    author: 'x-user:1',
    content: 'Anyone know a good CRM for a small sales team?',
    url: 'https://x.com/i/web/status/1',
    sourceCreatedAt: new Date('2026-08-10T00:00:00.000Z'),
    ...over,
  })

  it('keeps a post that carries a real question', () => {
    expect(filterQualifiedRecords([record({})])).toHaveLength(1)
  })

  it('keeps terse high-intent posts', () => {
    // "Need a CRM" is ten characters and is the strongest possible signal. Any
    // length floor tuned against spam has to clear this first.
    expect(filterQualifiedRecords([record({ content: 'Need a CRM' })])).toHaveLength(1)
    expect(filterQualifiedRecords([record({ content: 'any CRM recs?' })])).toHaveLength(1)
  })

  it('drops a single-word post that cannot express intent', () => {
    expect(filterQualifiedRecords([record({ content: 'hi' })])).toEqual([])
  })

  it('drops a post whose entire body is a link', () => {
    // The first production scan stored several of these as leads. There is
    // nothing for a classifier or a human to qualify.
    expect(filterQualifiedRecords([record({ content: 'https://t.co/mO2Ig8uwkG' })])).toEqual([])
  })

  it('drops a reply that is only mentions and a link', () => {
    expect(
      filterQualifiedRecords([record({ content: '@someone @another https://t.co/abc' })]),
    ).toEqual([])
  })

  it('caps how many records one author can contribute', () => {
    // Four betting accounts produced ten "leads" in the first real run by
    // reposting themselves.
    const spam = Array.from({ length: 5 }, (_, i) =>
      record({
        externalPostId: `tw_${i}`,
        author: 'x-user:spam',
        content: `Best plays tonight, huge value on the totals line, entry ${i}`,
      }),
    )
    expect(filterQualifiedRecords(spam)).toHaveLength(2)
  })

  it('counts the cap per author rather than across the batch', () => {
    const mixed = [
      record({ externalPostId: 'a1', author: 'x-user:a', content: 'Looking for a HubSpot alternative for our team' }),
      record({ externalPostId: 'b1', author: 'x-user:b', content: 'Looking for a HubSpot alternative for our team' }),
      record({ externalPostId: 'c1', author: 'x-user:c', content: 'Looking for a HubSpot alternative for our team' }),
    ]
    expect(filterQualifiedRecords(mixed)).toHaveLength(3)
  })

  it('preserves provider order for the records it keeps', () => {
    const ordered = [
      record({ externalPostId: 'first', content: 'Which CRM would you recommend for us?' }),
      record({ externalPostId: 'second', author: 'x-user:2', content: 'We are migrating off Salesforce soon' }),
    ]
    expect(filterQualifiedRecords(ordered).map((r) => r.externalPostId)).toEqual(['first', 'second'])
  })

  it('drops ticker technical-analysis chatter that matches CRM keywords', () => {
    expect(
      filterQualifiedRecords([
        record({
          content: '$CRM bounced perfectly from the AVWAP channel near the swing low',
        }),
      ]),
    ).toEqual([])
  })

  it('drops hiring and Discord promo spam', () => {
    expect(
      filterQualifiedRecords([
        record({ content: 'HIRING Now B2B SaaS Sales Executive. Job Title: AE. Location: Remote' }),
        record({ content: 'Join our Discord for lead tips https://discord.gg/spam' }),
      ]),
    ).toEqual([])
  })

  it('keeps buyer CRM asks that are not cashtags or job spam', () => {
    expect(
      filterQualifiedRecords([
        record({ content: '#LOOKING FOR CRM for our agency pipeline' }),
      ]),
    ).toHaveLength(1)
  })
})
