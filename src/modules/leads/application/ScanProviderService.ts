import 'server-only'

import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { MAX_ACTIVE_KEYWORDS_PER_TENANT } from '@/src/modules/keywords/application/KeywordService'
import {
  parseRedditPayload,
  parseXPayload,
  rateLimitResetAt,
  type NormalizedProviderRecord,
  type ProviderOutcome,
  type ScanProvider,
} from '../domain/providerTruth'

const PROVIDER_TIMEOUT_MS = 8_000
export const MAX_PROVIDER_CONCURRENCY = 6

// Reddit reading is implemented but not shipped yet. X is the only source we scan
// today; add 'REDDIT' back here to turn it on without touching the parsers.
export const ENABLED_PROVIDERS: readonly ScanProvider[] = ['X']

type Keyword = { id: string; phrase: string }
type ProviderTask = { provider: ScanProvider; keyword: Keyword }
type CompletedAttempt = {
  outcome: Exclude<ProviderOutcome, 'IN_PROGRESS'>
  httpStatusClass: number | null
  records: NormalizedProviderRecord[]
  rateLimitResetAt: Date | null
}

function providerUrl(provider: ScanProvider, phrase: string) {
  const query = encodeURIComponent(phrase)
  return provider === 'REDDIT'
    ? `https://www.reddit.com/search.json?q=${query}&type=link&sort=new&limit=10`
    : `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,author_id`
}

function requestHeaders(provider: ScanProvider, twitterToken?: string) {
  const headers = new Headers()
  if (provider === 'REDDIT') {
    headers.set('User-Agent', 'SEOlaQuest/1.0 durable-social-listener')
  } else {
    headers.set('Authorization', `Bearer ${twitterToken}`)
  }
  return headers
}

async function readProvider(
  provider: ScanProvider,
  keyword: Keyword,
  twitterToken?: string,
): Promise<CompletedAttempt> {
  if (provider === 'X' && !twitterToken) {
    return {
      outcome: 'PROVIDER_UNAVAILABLE',
      httpStatusClass: null,
      records: [],
      rateLimitResetAt: null,
    }
  }

  let response: Response
  try {
    response = await fetch(providerUrl(provider, keyword.phrase), {
      cache: 'no-store',
      headers: requestHeaders(provider, twitterToken),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    })
  } catch {
    return {
      outcome: 'PROVIDER_UNAVAILABLE',
      httpStatusClass: null,
      records: [],
      rateLimitResetAt: null,
    }
  }

  const httpStatusClass = Math.floor(response.status / 100)
  if (response.status === 429) {
    return {
      outcome: 'RATE_LIMITED',
      httpStatusClass,
      records: [],
      rateLimitResetAt: rateLimitResetAt(response.headers),
    }
  }
  if (!response.ok) {
    return {
      outcome: 'PROVIDER_UNAVAILABLE',
      httpStatusClass,
      records: [],
      rateLimitResetAt: null,
    }
  }

  try {
    const payload: unknown = await response.json()
    const records = provider === 'REDDIT'
      ? parseRedditPayload(payload)
      : parseXPayload(payload)
    return {
      outcome: records.length ? 'SUCCESS' : 'ZERO_RESULTS',
      httpStatusClass,
      records,
      rateLimitResetAt: null,
    }
  } catch {
    return {
      outcome: 'MALFORMED_RESPONSE',
      httpStatusClass,
      records: [],
      rateLimitResetAt: null,
    }
  }
}

async function persistCompletedAttempt(args: {
  attemptId: string
  scanRunId: string
  userId: string
  provider: ScanProvider
  keyword: Keyword
  result: CompletedAttempt
}) {
  const { attemptId, scanRunId, userId, provider, keyword, result } = args
  const completedAt = new Date()
  const records = Array.from(
    new Map(result.records.map((record) => [record.externalPostId, record])).values(),
  )

  return prisma.$transaction(async (tx) => {
    let insertedCount = 0
    if (records.length) {
      const created = await tx.lead.createMany({
        data: records.map((record): Prisma.LeadCreateManyInput => ({
          userId,
          keywordId: keyword.id,
          platform: provider === 'X' ? 'TWITTER' : 'REDDIT',
          externalPostId: record.externalPostId,
          author: record.author,
          content: record.content,
          matched: keyword.phrase,
          url: record.url,
          sourceCreatedAt: record.sourceCreatedAt,
          observedAt: completedAt,
        })),
        skipDuplicates: true,
      })
      insertedCount = created.count
      const externalPostIds = records.map((record) => record.externalPostId)
      await tx.lead.updateMany({
        where: { userId, externalPostId: { in: externalPostIds } },
        data: { observedAt: completedAt },
      })
      const persistedLeads = await tx.lead.findMany({
        where: { userId, externalPostId: { in: externalPostIds } },
        select: { id: true, externalPostId: true },
      })
      await tx.leadMatch.createMany({
        data: persistedLeads.map((lead) => ({
          leadId: lead.id,
          scanRunId,
          providerScanAttemptId: attemptId,
          keywordId: keyword.id,
          keywordSnapshot: keyword.phrase,
          matchedAt: completedAt,
        })),
        skipDuplicates: true,
      })
    }

    await tx.providerScanAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt,
        outcome: result.outcome,
        httpStatusClass: result.httpStatusClass,
        resultCount: records.length,
        insertedCount,
        rateLimitResetAt: result.rateLimitResetAt,
      },
    })
    return { outcome: result.outcome, leadsCreated: insertedCount }
  })
}

async function executeTask(
  scanRunId: string,
  userId: string,
  task: ProviderTask,
  twitterToken?: string,
) {
  const requestedAt = new Date()
  const attempt = await prisma.providerScanAttempt.upsert({
    where: {
      scanRunId_provider_keywordSnapshot: {
        scanRunId,
        provider: task.provider,
        keywordSnapshot: task.keyword.phrase,
      },
    },
    update: {
      keywordId: task.keyword.id,
      requestedAt,
      completedAt: null,
      outcome: 'IN_PROGRESS',
      httpStatusClass: null,
      resultCount: 0,
      insertedCount: 0,
      rateLimitResetAt: null,
    },
    create: {
      scanRunId,
      keywordId: task.keyword.id,
      keywordSnapshot: task.keyword.phrase,
      provider: task.provider,
      requestedAt,
    },
  })
  const result = await readProvider(task.provider, task.keyword, twitterToken)
  return persistCompletedAttempt({
    attemptId: attempt.id,
    scanRunId,
    userId,
    provider: task.provider,
    keyword: task.keyword,
    result,
  })
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
) {
  const results: Array<PromiseSettledResult<R>> = new Array(values.length)
  let cursor = 0
  async function worker() {
    while (cursor < values.length) {
      const index = cursor
      cursor += 1
      try {
        results[index] = { status: 'fulfilled', value: await mapper(values[index]) }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }
  await Promise.all(Array.from(
    { length: Math.min(concurrency, values.length) },
    () => worker(),
  ))
  return results
}

export class ScanProviderService {
  static async scanTenant(userId: string, scanRunId: string) {
    const keywords = await prisma.trackedKeyword.findMany({
      where: { userId, active: true },
      select: { id: true, phrase: true },
      orderBy: { createdAt: 'asc' },
      take: MAX_ACTIVE_KEYWORDS_PER_TENANT + 1,
    })

    if (!keywords.length) {
      return { providerSucceeded: false, leadsCreated: 0, errorCode: 'NO_ACTIVE_KEYWORDS' }
    }
    if (keywords.length > MAX_ACTIVE_KEYWORDS_PER_TENANT) {
      return { providerSucceeded: false, leadsCreated: 0, errorCode: 'ACTIVE_KEYWORD_LIMIT_EXCEEDED' }
    }

    const twitterToken = process.env.TWITTER_BEARER_TOKEN?.trim()
    const tasks = keywords.flatMap((keyword): ProviderTask[] =>
      ENABLED_PROVIDERS.map((provider) => ({ provider, keyword })),
    )
    const results = await mapWithConcurrency(
      tasks,
      MAX_PROVIDER_CONCURRENCY,
      (task) => executeTask(scanRunId, userId, task, twitterToken),
    )

    let successfulAttempts = 0
    let failedAttempts = 0
    let leadsCreated = 0
    for (const result of results) {
      if (result.status === 'rejected') {
        failedAttempts += 1
        logger.warn({ outcomeCode: 'SCAN_PROVIDER_ATTEMPT_PERSISTENCE_FAILED' }, 'Scan provider attempt failed')
        continue
      }
      leadsCreated += result.value.leadsCreated
      if (result.value.outcome === 'SUCCESS' || result.value.outcome === 'ZERO_RESULTS') {
        successfulAttempts += 1
      } else {
        failedAttempts += 1
      }
    }

    if (!successfulAttempts) {
      return { providerSucceeded: false, leadsCreated: 0, errorCode: 'ALL_SCAN_PROVIDERS_UNAVAILABLE' }
    }
    return {
      providerSucceeded: true,
      leadsCreated,
      ...(failedAttempts ? { errorCode: 'PARTIAL_PROVIDER_OUTAGE' } : {}),
    }
  }
}
