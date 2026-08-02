import 'server-only'

import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { MAX_ACTIVE_KEYWORDS_PER_TENANT } from '@/src/modules/keywords/application/KeywordService'

const PROVIDER_TIMEOUT_MS = 8_000
function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

type Keyword = { id: string; phrase: string }
type LeadCreate = Prisma.LeadCreateManyInput

type ProviderResult = {
  providerSucceeded: boolean
  leads: LeadCreate[]
}

async function searchReddit(userId: string, keyword: Keyword): Promise<ProviderResult> {
  const query = encodeURIComponent(keyword.phrase)
  const response = await fetch(
    `https://www.reddit.com/search.json?q=${query}&type=link&sort=new&limit=10`,
    {
      cache: 'no-store',
      headers: { 'User-Agent': 'CoQuest/1.0 durable-social-listener' },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    },
  )
  if (!response.ok) return { providerSucceeded: false, leads: [] }

  const json = (await response.json()) as {
    data?: { children?: Array<{ data?: Record<string, unknown> }> }
  }
  const leads: LeadCreate[] = []
  for (const child of json.data?.children ?? []) {
    const post = child.data
    if (!post) continue
    const externalPostId = typeof post.name === 'string' ? post.name : null
    const permalink = typeof post.permalink === 'string' ? post.permalink : null
    if (!externalPostId || !permalink || !permalink.startsWith('/')) continue

    const title = typeof post.title === 'string' ? post.title : ''
    const body = typeof post.selftext === 'string' ? post.selftext : ''
    const content = cleanText(`${title} ${body}`, 700)
    if (!content) continue

    leads.push({
      userId,
      keywordId: keyword.id,
      platform: 'REDDIT',
      externalPostId,
      author: typeof post.author === 'string' ? `u/${cleanText(post.author, 80)}` : 'u/[deleted]',
      content,
      matched: keyword.phrase,
      url: `https://www.reddit.com${permalink}`,
      sourceCreatedAt: typeof post.created_utc === 'number'
        ? new Date(post.created_utc * 1000)
        : null,
    })
  }
  return { providerSucceeded: true, leads }
}

async function searchTwitter(userId: string, keyword: Keyword, token: string): Promise<ProviderResult> {
  const query = encodeURIComponent(keyword.phrase)
  const response = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,author_id`,
    {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    },
  )
  if (!response.ok) return { providerSucceeded: false, leads: [] }

  const json = (await response.json()) as {
    data?: Array<{ id?: unknown; text?: unknown; created_at?: unknown; author_id?: unknown }>
  }
  const leads: LeadCreate[] = []
  for (const tweet of json.data ?? []) {
    if (typeof tweet.id !== 'string' || typeof tweet.text !== 'string') continue
    const content = cleanText(tweet.text, 500)
    if (!content) continue
    leads.push({
      userId,
      keywordId: keyword.id,
      platform: 'TWITTER',
      externalPostId: `tw_${tweet.id}`,
      author: typeof tweet.author_id === 'string' ? `x-user:${tweet.author_id}` : 'x-user:unknown',
      content,
      matched: keyword.phrase,
      url: `https://x.com/i/web/status/${tweet.id}`,
      sourceCreatedAt: typeof tweet.created_at === 'string' ? new Date(tweet.created_at) : null,
    })
  }
  return { providerSucceeded: true, leads }
}

export class ScanProviderService {
  static async scanTenant(userId: string) {
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

    const leads: LeadCreate[] = []
    let providerSucceeded = false
    const twitterToken = process.env.TWITTER_BEARER_TOKEN?.trim()

    const attempts = keywords.flatMap((keyword) => [
      searchReddit(userId, keyword),
      ...(twitterToken ? [searchTwitter(userId, keyword, twitterToken)] : []),
    ])
    const results = await Promise.allSettled(attempts)
    for (const result of results) {
      if (result.status === 'fulfilled') {
        providerSucceeded ||= result.value.providerSucceeded
        leads.push(...result.value.leads)
      } else {
        logger.warn({ outcomeCode: 'SCAN_PROVIDER_REQUEST_FAILED' }, 'Scan provider request failed')
      }
    }

    if (!providerSucceeded) {
      return { providerSucceeded: false, leadsCreated: 0, errorCode: 'ALL_SCAN_PROVIDERS_UNAVAILABLE' }
    }

    const uniqueLeads = Array.from(
      new Map(leads.map((lead) => [lead.externalPostId, lead])).values(),
    )
    const inserted = uniqueLeads.length
      ? await prisma.lead.createMany({ data: uniqueLeads, skipDuplicates: true })
      : { count: 0 }

    return { providerSucceeded: true, leadsCreated: inserted.count }
  }
}
