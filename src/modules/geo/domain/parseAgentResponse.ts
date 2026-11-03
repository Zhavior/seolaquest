import { z } from 'zod'
import { classifySource, hostMatches, hostnameOf, type ClassificationBasis, type SourceType } from './sourceType'

/**
 * Parses an engine's response into the sources a scan cares about: a Perplexity
 * Agent API (`POST /v1/agent`) response here, a Claude one in
 * `parseClaudeScanResponse` below.
 *
 * Two different things are kept apart on purpose:
 * - retrieved: every page the engine's web search returned (`search_results`).
 * - cited: the pages the answer actually points at, via `url_citation`
 *   annotations or inline `[n]` / `[web:n]` markers that map to a result id.
 * A brand that is retrieved but not cited lost at the answer stage, not the
 * search stage, and that is a different fix.
 *
 * Only fields documented in the Agent API reference are read. Anything else in
 * the payload is ignored rather than guessed at.
 */

const searchResultSchema = z.object({
  id: z.number().int().optional(),
  url: z.string(),
  title: z.string().optional().default(''),
  snippet: z.string().optional().default(''),
})

const annotationSchema = z.object({
  type: z.string().optional(),
  url: z.string().optional(),
  start_index: z.number().int().optional(),
})

const outputItemSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('search_results'),
    results: z.array(searchResultSchema).default([]),
  }),
  z.object({
    type: z.literal('message'),
    content: z
      .array(
        z.object({
          type: z.string(),
          text: z.string().default(''),
          annotations: z.array(annotationSchema).optional().default([]),
        }),
      )
      .default([]),
  }),
])

const costSchema = z
  .object({
    total_cost: z.number(),
    currency: z.string().optional(),
  })
  .passthrough()

const responseSchema = z.object({
  id: z.string().optional(),
  model: z.string().optional(),
  status: z.string().optional(),
  output: z.array(z.unknown()).default([]),
  usage: z
    .object({
      input_tokens: z.number().int().optional(),
      output_tokens: z.number().int().optional(),
      cost: costSchema.optional(),
    })
    .optional(),
})

export interface GeoSource {
  url: string
  domain: string | null
  title: string
  snippet: string
  /** 1-based position in the engine's search results, or null if only seen as a citation. */
  retrievedRank: number | null
  cited: boolean
  /** 1-based order of first citation in the answer text, or null when not cited. */
  citedRank: number | null
  sourceType: SourceType
  basis: ClassificationBasis
}

export interface ParsedAgentResponse {
  responseId: string | null
  model: string | null
  status: string | null
  answerText: string
  sources: GeoSource[]
  inputTokens: number | null
  outputTokens: number | null
  /** Engine-reported USD. Null when the engine did not report a cost. */
  costUsd: number | null
  costDetails: Record<string, unknown> | null
}

export interface BrandPresence {
  brandCited: boolean
  brandCitedRank: number | null
  brandRetrieved: boolean
}

const MARKER = /\[(?:web:)?(\d+)\]/g
const SNIPPET_LIMIT = 300

/**
 * Turns an engine's retrieved pages and its citations, in answer order, into the
 * one source list every engine shares. The first citation of a page sets its rank.
 */
function assembleSources(
  retrieved: { url: string; title: string; snippet: string }[],
  citations: { url: string; title?: string; snippet?: string }[],
): GeoSource[] {
  const citedRankByUrl = new Map<string, number>()
  for (const citation of citations) {
    if (!citedRankByUrl.has(citation.url)) citedRankByUrl.set(citation.url, citedRankByUrl.size + 1)
  }

  const sources: GeoSource[] = []
  const seen = new Set<string>()
  const addSource = (url: string, title: string, snippet: string, retrievedRank: number | null) => {
    if (seen.has(url)) return
    seen.add(url)
    const citedRank = citedRankByUrl.get(url) ?? null
    const citation = citations.find((entry) => entry.url === url)
    sources.push({
      url,
      domain: hostnameOf(url),
      title: title || citation?.title || '',
      snippet: (snippet || citation?.snippet || '').slice(0, SNIPPET_LIMIT),
      retrievedRank,
      cited: citedRank !== null,
      citedRank,
      ...classifySource(url),
    })
  }

  retrieved.forEach((result) => addSource(result.url, result.title, result.snippet, seen.size + 1))
  // A citation can point at a page that was not in the search results payload.
  for (const url of citedRankByUrl.keys()) addSource(url, '', '', null)
  return sources
}

export function parseAgentResponse(raw: unknown): ParsedAgentResponse {
  const response = responseSchema.parse(raw)

  const results: z.infer<typeof searchResultSchema>[] = []
  const textParts: { text: string; annotations: z.infer<typeof annotationSchema>[] }[] = []

  for (const item of response.output) {
    // Unknown item types (tool calls, image results, ...) are skipped, not rejected.
    const parsed = outputItemSchema.safeParse(item)
    if (!parsed.success) continue
    if (parsed.data.type === 'search_results') results.push(...parsed.data.results)
    else {
      for (const part of parsed.data.content) {
        if (part.type === 'output_text') textParts.push({ text: part.text, annotations: part.annotations })
      }
    }
  }

  const urlById = new Map<number, string>()
  for (const result of results) {
    if (result.id !== undefined && !urlById.has(result.id)) urlById.set(result.id, result.url)
  }

  // Citation events in answer order. Offsets are made global across text parts
  // so ordering holds when the answer is split into several parts.
  const events: { position: number; url: string }[] = []
  let offset = 0
  for (const part of textParts) {
    for (const annotation of part.annotations) {
      if (annotation.url && (annotation.type === undefined || annotation.type === 'url_citation')) {
        events.push({ position: offset + (annotation.start_index ?? 0), url: annotation.url })
      }
    }
    for (const match of part.text.matchAll(MARKER)) {
      const url = urlById.get(Number(match[1]))
      if (url) events.push({ position: offset + (match.index ?? 0), url })
    }
    offset += part.text.length + 1
  }
  events.sort((a, b) => a.position - b.position)

  const sources = assembleSources(results, events.map((event) => ({ url: event.url })))

  const cost = response.usage?.cost
  return {
    responseId: response.id ?? null,
    model: response.model ?? null,
    status: response.status ?? null,
    answerText: textParts.map((part) => part.text).join('\n'),
    sources,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
    costUsd: cost ? cost.total_cost : null,
    costDetails: cost ? (cost as Record<string, unknown>) : null,
  }
}

const claudeMessageSchema = z.object({
  id: z.string().optional(),
  model: z.string().optional(),
  stop_reason: z.string().nullish(),
  content: z.array(z.unknown()).default([]),
  usage: z
    .object({
      input_tokens: z.number().int(),
      output_tokens: z.number().int(),
      web_search_requests: z.number().int().optional(),
    })
    .optional(),
})

const claudeSearchBlockSchema = z.object({
  type: z.literal('web_search_tool_result'),
  // On failure this is one error object, not a list, and that search adds no pages.
  content: z.array(z.object({ url: z.string(), title: z.string().nullish() })),
})

const claudeTextBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string().default(''),
  citations: z
    .array(
      z.object({
        type: z.string(),
        url: z.string().optional(),
        title: z.string().nullish(),
        cited_text: z.string().optional(),
      }),
    )
    .nullish(),
})

/**
 * Parses the merged message from `runClaudeScan` into the same shape as a
 * Perplexity scan. Retrieved means pages returned by a search block; cited means
 * pages a text block's citations point at, in answer order.
 *
 * `costUsd` stays null: the Messages API reports tokens and search counts, not
 * dollars, and those counts are kept in `costDetails` rather than priced here
 * from a rate card that can change.
 */
export function parseClaudeScanResponse(raw: unknown): ParsedAgentResponse {
  const response = claudeMessageSchema.parse(raw)

  const retrieved: { url: string; title: string; snippet: string }[] = []
  const citations: { url: string; title?: string; snippet?: string }[] = []
  const answer: string[] = []

  for (const block of response.content) {
    const search = claudeSearchBlockSchema.safeParse(block)
    if (search.success) {
      for (const result of search.data.content) {
        retrieved.push({ url: result.url, title: result.title ?? '', snippet: '' })
      }
      continue
    }
    const text = claudeTextBlockSchema.safeParse(block)
    if (!text.success) continue
    answer.push(text.data.text)
    for (const citation of text.data.citations ?? []) {
      if (citation.type === 'web_search_result_location' && citation.url) {
        citations.push({ url: citation.url, title: citation.title ?? undefined, snippet: citation.cited_text })
      }
    }
  }

  return {
    responseId: response.id ?? null,
    model: response.model ?? null,
    status: response.stop_reason ?? null,
    answerText: answer.join('').trim(),
    sources: assembleSources(retrieved, citations),
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
    costUsd: null,
    costDetails: response.usage ? { webSearchRequests: response.usage.web_search_requests ?? 0 } : null,
  }
}

export function brandPresence(sources: GeoSource[], brandDomain: string): BrandPresence {
  const matching = sources.filter((source) => source.domain && hostMatches(source.domain, brandDomain))
  const citedRanks = matching.flatMap((source) => (source.citedRank === null ? [] : [source.citedRank]))
  return {
    brandCited: citedRanks.length > 0,
    brandCitedRank: citedRanks.length > 0 ? Math.min(...citedRanks) : null,
    brandRetrieved: matching.length > 0,
  }
}
