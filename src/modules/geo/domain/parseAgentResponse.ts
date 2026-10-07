import { z } from 'zod'
import { classifySource, hostMatches, hostnameOf, type ClassificationBasis, type SourceType } from './sourceType'

/**
 * Parses a Perplexity Agent API (`POST /v1/agent`) response into the sources a
 * scan cares about.
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

  const citedRankByUrl = new Map<string, number>()
  for (const event of events) {
    if (!citedRankByUrl.has(event.url)) citedRankByUrl.set(event.url, citedRankByUrl.size + 1)
  }

  const sources: GeoSource[] = []
  const seen = new Set<string>()
  const addSource = (url: string, title: string, snippet: string, retrievedRank: number | null) => {
    if (seen.has(url)) return
    seen.add(url)
    const citedRank = citedRankByUrl.get(url) ?? null
    sources.push({
      url,
      domain: hostnameOf(url),
      title,
      snippet: snippet.slice(0, SNIPPET_LIMIT),
      retrievedRank,
      cited: citedRank !== null,
      citedRank,
      ...classifySource(url),
    })
  }

  results.forEach((result) => addSource(result.url, result.title, result.snippet, seen.size + 1))
  // Annotations can cite a page that was not in the search results payload.
  for (const url of citedRankByUrl.keys()) addSource(url, '', '', null)

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

export function brandPresence(sources: GeoSource[], brandDomain: string): BrandPresence {
  const matching = sources.filter((source) => source.domain && hostMatches(source.domain, brandDomain))
  const citedRanks = matching.flatMap((source) => (source.citedRank === null ? [] : [source.citedRank]))
  return {
    brandCited: citedRanks.length > 0,
    brandCitedRank: citedRanks.length > 0 ? Math.min(...citedRanks) : null,
    brandRetrieved: matching.length > 0,
  }
}
