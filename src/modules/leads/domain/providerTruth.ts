import { z } from 'zod'

export const PROVIDERS = ['REDDIT', 'X'] as const
export type ScanProvider = (typeof PROVIDERS)[number]

export const PROVIDER_OUTCOMES = [
  'IN_PROGRESS',
  'SUCCESS',
  'ZERO_RESULTS',
  'MALFORMED_RESPONSE',
  'RATE_LIMITED',
  'PROVIDER_UNAVAILABLE',
] as const
export type ProviderOutcome = (typeof PROVIDER_OUTCOMES)[number]

const MAX_SOURCE_AGE_MS = 90 * 24 * 60 * 60_000
const MAX_FUTURE_SKEW_MS = 5 * 60_000

const RedditPayloadSchema = z.object({
  data: z.object({
    children: z.array(z.object({
      data: z.object({
        name: z.string().regex(/^t3_[a-z0-9]+$/i).max(80),
        permalink: z.string().startsWith('/').max(2_000),
        title: z.string().max(10_000).optional().default(''),
        selftext: z.string().max(100_000).optional().default(''),
        author: z.string().max(160).optional(),
        created_utc: z.number().finite().positive(),
      }).passthrough(),
    }).passthrough()),
  }).passthrough(),
}).passthrough()

const XPayloadSchema = z.object({
  data: z.array(z.object({
    id: z.string().regex(/^\d{1,32}$/),
    text: z.string().min(1).max(10_000),
    created_at: z.string().min(1).max(80),
    author_id: z.string().regex(/^\d{1,32}$/).optional(),
  }).passthrough()).optional().default([]),
}).passthrough()

export type NormalizedProviderRecord = {
  externalPostId: string
  author: string
  content: string
  url: string
  sourceCreatedAt: Date
}

export type ProviderAttemptAggregate = {
  provider: ScanProvider
  attempts: number
  successful: number
  zeroResults: number
  malformed: number
  rateLimited: number
  unavailable: number
  inProgress: number
  resultCount: number
  insertedCount: number
  rateLimitResetAt: Date | null
}

export class MalformedProviderResponseError extends Error {
  readonly code = 'MALFORMED_PROVIDER_RESPONSE'

  constructor() {
    super('Provider response failed validation')
    this.name = 'MalformedProviderResponseError'
  }
}

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function sourceDate(value: number | string, now: Date) {
  const date = typeof value === 'number' ? new Date(value * 1_000) : new Date(value)
  const timestamp = date.getTime()
  if (
    !Number.isFinite(timestamp)
    || timestamp > now.getTime() + MAX_FUTURE_SKEW_MS
    || timestamp < now.getTime() - MAX_SOURCE_AGE_MS
  ) {
    throw new MalformedProviderResponseError()
  }
  return date
}

export function parseRedditPayload(payload: unknown, now = new Date()): NormalizedProviderRecord[] {
  const parsed = RedditPayloadSchema.safeParse(payload)
  if (!parsed.success) throw new MalformedProviderResponseError()

  try {
    return parsed.data.data.children.map(({ data: post }) => {
      const content = cleanText(`${post.title} ${post.selftext}`, 700)
      if (!content) throw new MalformedProviderResponseError()
      return {
        externalPostId: post.name,
        author: post.author ? `u/${cleanText(post.author, 80)}` : 'u/[deleted]',
        content,
        url: `https://www.reddit.com${post.permalink}`,
        sourceCreatedAt: sourceDate(post.created_utc, now),
      }
    })
  } catch {
    throw new MalformedProviderResponseError()
  }
}

export function parseXPayload(payload: unknown, now = new Date()): NormalizedProviderRecord[] {
  const parsed = XPayloadSchema.safeParse(payload)
  if (!parsed.success) throw new MalformedProviderResponseError()

  try {
    return parsed.data.data.map((post) => ({
      externalPostId: `tw_${post.id}`,
      author: post.author_id ? `x-user:${post.author_id}` : 'x-user:unknown',
      content: cleanText(post.text, 500),
      url: `https://x.com/i/web/status/${post.id}`,
      sourceCreatedAt: sourceDate(post.created_at, now),
    }))
  } catch {
    throw new MalformedProviderResponseError()
  }
}

/**
 * Text left once URLs and the leading @mentions of a reply are removed. A post
 * whose whole body is `https://t.co/mO2Ig8uwkG` carries no intent for any
 * classifier — semantic or human — to read.
 */
function substantiveText(content: string): string {
  return content
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^(?:\s*@\w+)+/, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The bar is "did this person write anything", not "did they write enough".
 *
 * An earlier version of this required 20 characters, which the existing suite
 * immediately rejected: its fixture is `Need a CRM` — ten characters and one of
 * the highest-intent posts imaginable. Real buying intent is often terse
 * ("any CRM recs?"), so a length floor tuned to filter spam removes the best
 * leads first. Two words is enough to separate a written thought from a bare
 * URL, which is the only thing this needs to catch.
 */
const MIN_SUBSTANTIVE_CHARS = 8
const MIN_SUBSTANTIVE_WORDS = 2

/**
 * One account posting the same promo five times is one account, not five leads.
 * A genuine buyer almost never asks the same question twice in one window, so a
 * low cap costs real signal nothing and removes the bulk of promo spam.
 */
const MAX_RECORDS_PER_AUTHOR = 2

/**
 * Drops records that cannot become leads, before they are written as leads.
 *
 * Filtering here rather than at display time matters: a stored row is what gets
 * counted in "25 source matches", metered against the tenant's AI budget, and
 * sent to their CRM. Hiding junk in the UI would leave all three wrong.
 */
export function filterQualifiedRecords(
  records: NormalizedProviderRecord[],
): NormalizedProviderRecord[] {
  const perAuthor = new Map<string, number>()
  const qualified: NormalizedProviderRecord[] = []

  for (const record of records) {
    const text = substantiveText(record.content)
    if (text.length < MIN_SUBSTANTIVE_CHARS) continue
    if (text.split(' ').filter(Boolean).length < MIN_SUBSTANTIVE_WORDS) continue

    const seen = perAuthor.get(record.author) ?? 0
    if (seen >= MAX_RECORDS_PER_AUTHOR) continue

    perAuthor.set(record.author, seen + 1)
    qualified.push(record)
  }

  return qualified
}

export function rateLimitResetAt(headers: Headers, now = new Date()) {
  const epochSeconds = Number(headers.get('x-rate-limit-reset'))
  if (Number.isFinite(epochSeconds) && epochSeconds > 0) {
    const candidate = new Date(epochSeconds * 1_000)
    return candidate.getTime() > now.getTime() ? candidate : null
  }

  const retryAfter = headers.get('retry-after')?.trim()
  if (!retryAfter) return null
  const seconds = Number(retryAfter)
  const candidate = Number.isFinite(seconds)
    ? new Date(now.getTime() + Math.max(0, seconds) * 1_000)
    : new Date(retryAfter)
  return Number.isFinite(candidate.getTime()) && candidate.getTime() > now.getTime()
    ? candidate
    : null
}

export function aggregateProviderAttempts(attempts: Array<{
  provider: string
  outcome: string
  resultCount: number
  insertedCount: number
  rateLimitResetAt: Date | null
}>) {
  const aggregates = PROVIDERS.map<ProviderAttemptAggregate>((provider) => ({
    provider,
    attempts: 0,
    successful: 0,
    zeroResults: 0,
    malformed: 0,
    rateLimited: 0,
    unavailable: 0,
    inProgress: 0,
    resultCount: 0,
    insertedCount: 0,
    rateLimitResetAt: null,
  }))
  const byProvider = new Map(aggregates.map((aggregate) => [aggregate.provider, aggregate]))

  for (const attempt of attempts) {
    const aggregate = byProvider.get(attempt.provider as ScanProvider)
    if (!aggregate) continue
    aggregate.attempts += 1
    aggregate.resultCount += attempt.resultCount
    aggregate.insertedCount += attempt.insertedCount
    if (attempt.outcome === 'SUCCESS') aggregate.successful += 1
    else if (attempt.outcome === 'ZERO_RESULTS') aggregate.zeroResults += 1
    else if (attempt.outcome === 'MALFORMED_RESPONSE') aggregate.malformed += 1
    else if (attempt.outcome === 'RATE_LIMITED') aggregate.rateLimited += 1
    else if (attempt.outcome === 'PROVIDER_UNAVAILABLE') aggregate.unavailable += 1
    else if (attempt.outcome === 'IN_PROGRESS') aggregate.inProgress += 1

    if (
      attempt.rateLimitResetAt
      && (!aggregate.rateLimitResetAt || attempt.rateLimitResetAt > aggregate.rateLimitResetAt)
    ) {
      aggregate.rateLimitResetAt = attempt.rateLimitResetAt
    }
  }

  const completedSuccesses = aggregates.reduce(
    (total, aggregate) => total + aggregate.successful + aggregate.zeroResults,
    0,
  )
  const completedFailures = aggregates.reduce(
    (total, aggregate) => total + aggregate.malformed + aggregate.rateLimited + aggregate.unavailable,
    0,
  )
  const inProgress = aggregates.reduce((total, aggregate) => total + aggregate.inProgress, 0)
  const status = inProgress > 0
    ? 'IN_PROGRESS'
    : completedSuccesses > 0 && completedFailures > 0
      ? 'PARTIAL_OUTAGE'
      : completedSuccesses > 0
        ? 'AVAILABLE'
        : completedFailures > 0
          ? 'UNAVAILABLE'
          : 'NOT_STARTED'

  return { status, providers: aggregates }
}
