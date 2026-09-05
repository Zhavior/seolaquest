import 'server-only'

import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { EventFactory } from '@/src/modules/core/events/EventFactory'
import { EventStore } from '@/src/modules/core/events/EventStore'
import { MAX_ACTIVE_KEYWORDS_PER_TENANT } from '@/src/modules/keywords/application/KeywordService'
import {
  filterQualifiedRecords,
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

/**
 * A bare keyword returns whatever the provider has, which in practice is mostly
 * retweets and non-English posts. The first real scan run returned ten "leads"
 * for one keyword that were four sports-betting accounts reposting each other.
 *
 * `-is:retweet` is the single highest-value filter: a retweet is someone else's
 * words, so it can never be a lead — the account that posted it is not the one
 * with the need. `lang:en` matches the only language the classifier prompt and
 * the reply drafts are written in.
 *
 * Replies are deliberately NOT excluded. The best lead in that first run was a
 * reply ("What's your budget range for a CRM solution?"), which is exactly the
 * shape real buying intent takes.
 */
function providerUrl(provider: ScanProvider, phrase: string) {
  if (provider === 'REDDIT') {
    return `https://www.reddit.com/search.json?q=${encodeURIComponent(phrase)}&type=link&sort=new&limit=10`
  }
  const query = encodeURIComponent(`${phrase} -is:retweet lang:en`)
  return `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,author_id`
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
    // Parsing stays faithful to what the provider returned; qualification is a
    // separate step so a filtered-out post is never mistaken for a parse failure.
    const records = filterQualifiedRecords(
      provider === 'REDDIT' ? parseRedditPayload(payload) : parseXPayload(payload),
    )
    return {
      // A response that parsed fine but qualified nothing is genuinely zero
      // results for this tenant, not a provider fault.
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
      const externalPostIdsSeen = records.map((record) => record.externalPostId)

      /**
       * Which of these posts we had already stored, read BEFORE the insert.
       *
       * `createMany({ skipDuplicates: true })` returns only a count and no ids, and the
       * `findMany` below deliberately re-reads every id in the batch so `LeadMatch` rows are
       * written for re-observed posts too. That means the post-insert read cannot tell a
       * first sighting from a repeat one, and `opportunity.discovered` must fire only on a
       * first sighting: Aurora bills a Gemini call per event, and re-emitting for a post seen
       * on every daily scan would re-evaluate the same lead forever. Aurora's own idempotency
       * key is derived from the *event* id, so it would not dedupe them either.
       */
      const alreadyStored = await tx.lead.findMany({
        where: { userId, externalPostId: { in: externalPostIdsSeen } },
        select: { externalPostId: true },
      })
      const previouslySeen = new Set(alreadyStored.map((lead) => lead.externalPostId))

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
      const externalPostIds = externalPostIdsSeen
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

      /**
       * The discovery event, written in the SAME transaction as the lead rows.
       *
       * This is the transactional outbox rule the architecture doc states at §3: if the
       * insert commits and the event does not, Aurora never sees the lead and nothing ever
       * notices. Writing it here rather than after the transaction is what makes
       * "every stored lead was evaluated" true by construction.
       *
       * Invalid event construction fails the transaction so a retry can repair it.
       */
      const recordByExternalPostId = new Map(records.map((record) => [record.externalPostId, record]))
      const newlyDiscovered = persistedLeads.filter((lead) => !previouslySeen.has(lead.externalPostId))

      for (const lead of newlyDiscovered) {
        const record = recordByExternalPostId.get(lead.externalPostId)
        if (!record) throw new Error('Discovery source record missing')

        const event = EventFactory.create({
          type: 'opportunity.discovered',
          version: 1,
          // The scan is machine-initiated; the tenant is carried on the payload instead so
          // Aurora can meter its classifier spend against the account that owns the lead.
          actorId: 'scan-pipeline',
          source: 'ScanProviderService',
          // Stable per lead, so a replayed scan cannot enqueue a second evaluation of the
          // same opportunity even if the pre-insert read above were ever to race.
          idempotencyKey: `opportunity.discovered:${lead.id}`,
          payload: {
            // A Lead IS the opportunity — there is no Opportunity table. See the schema
            // comment on OpportunityDiscoveredPayloadSchema.
            opportunityId: lead.id,
            leadId: lead.id,
            userId,
            keywordId: keyword.id,
            keywordPhrase: keyword.phrase,
            platform: provider === 'X' ? 'TWITTER' : 'REDDIT',
            externalPostId: record.externalPostId,
            author: record.author,
            content: record.content,
            url: record.url,
            sourceCreatedAt: record.sourceCreatedAt.toISOString(),
          },
        })

        await EventStore.writeOutbox(event, tx)

      }
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
