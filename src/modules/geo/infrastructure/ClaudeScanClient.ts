import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_SMART_MODEL } from '@/lib/anthropic'

/**
 * Asks Claude a buyer's question with web search on, so a scan can show which
 * pages Claude's answer cites.
 *
 * Same rule as the Perplexity client: only the query is sent. The user's domain
 * is never included, because naming the brand would bias the answer being
 * measured. The system line only asks for a searched, cited answer, since a tool
 * cannot be forced on this model and an answer from memory has no sources.
 *
 * Refusal fallback stays off here, unlike the other Sonnet calls: a scan has to
 * measure the engine it names, so a declined question is a failed scan rather
 * than a different model's answer. Retries stay off too, because a failed call
 * may still have been billed.
 */

export const CLAUDE_SCAN_TOOL = 'web_search_20260209'
const SYSTEM = 'Search the web before you answer, and cite the sources you rely on.'
const MAX_SEARCHES = 5
const MAX_TOKENS = 8000
const TIMEOUT_MS = 60_000
/** The server pauses long search loops. Three turns is ample for five searches. */
const MAX_TURNS = 3

export class ClaudeScanRequestError extends Error {
  constructor(
    readonly code: 'TIMEOUT' | 'NETWORK' | 'HTTP_ERROR' | 'REFUSED' | 'UNFINISHED',
    readonly httpStatus: number | null = null,
  ) {
    super(`Claude scan failed: ${code}${httpStatus ? ` (${httpStatus})` : ''}`)
    this.name = 'ClaudeScanRequestError'
  }
}

function requestError(error: unknown): ClaudeScanRequestError {
  if (error instanceof Anthropic.APIConnectionTimeoutError) return new ClaudeScanRequestError('TIMEOUT')
  if (error instanceof Anthropic.APIConnectionError) return new ClaudeScanRequestError('NETWORK')
  if (error instanceof Anthropic.APIError) return new ClaudeScanRequestError('HTTP_ERROR', error.status ?? null)
  return new ClaudeScanRequestError('NETWORK')
}

/** Returns one message whose content and usage cover every turn of the search. */
export async function runClaudeScan(query: string, apiKey: string): Promise<unknown> {
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: TIMEOUT_MS })
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: query }]
  const content: Anthropic.ContentBlock[] = []
  const usage = { input_tokens: 0, output_tokens: 0, web_search_requests: 0 }

  for (let turn = 1; turn <= MAX_TURNS; turn += 1) {
    let response: Anthropic.Message
    try {
      response = await client.messages.create({
        model: CLAUDE_SMART_MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM,
        messages,
        tools: [{ type: CLAUDE_SCAN_TOOL, name: 'web_search', max_uses: MAX_SEARCHES }],
        output_config: { effort: 'medium' },
      })
    } catch (error) {
      throw requestError(error)
    }

    content.push(...response.content)
    usage.input_tokens += response.usage.input_tokens
    usage.output_tokens += response.usage.output_tokens
    usage.web_search_requests += response.usage.server_tool_use?.web_search_requests ?? 0

    if (response.stop_reason === 'refusal') throw new ClaudeScanRequestError('REFUSED')
    if (response.stop_reason === 'end_turn') {
      return { id: response.id, model: response.model, stop_reason: response.stop_reason, content, usage }
    }
    // A cut-off answer can stop before the citation that names the brand, so anything
    // short of a finished turn fails the scan rather than reporting the brand as absent.
    if (response.stop_reason !== 'pause_turn') throw new ClaudeScanRequestError('UNFINISHED')
    messages.push({ role: 'assistant', content: response.content })
  }

  throw new ClaudeScanRequestError('UNFINISHED')
}
