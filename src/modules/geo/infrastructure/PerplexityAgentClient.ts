import 'server-only'

/**
 * Minimal client for Perplexity's Agent API (`POST /v1/agent`).
 *
 * Why the Agent API and not Sonar: as of 2026-10 Perplexity's docs list Sonar
 * chat completions only as a migration source, map `sonar` to the `fast`
 * preset, and say Sonar requests are being reformulated as Agent API requests.
 * Building the prototype on the path being retired would mean rewriting it.
 *
 * Only the query is sent. The user's domain is never included, because naming
 * the brand in the prompt would bias the very answer being measured.
 */

const ENDPOINT = 'https://api.perplexity.ai/v1/agent'
export const PERPLEXITY_PRESET = 'fast'
const TIMEOUT_MS = 60_000

export class PerplexityRequestError extends Error {
  constructor(
    readonly code: 'TIMEOUT' | 'NETWORK' | 'HTTP_ERROR' | 'BAD_JSON',
    readonly httpStatus: number | null = null,
  ) {
    super(`Perplexity request failed: ${code}${httpStatus ? ` (${httpStatus})` : ''}`)
    this.name = 'PerplexityRequestError'
  }
}

export async function runPerplexityAgent(query: string, apiKey: string): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // store: false — nothing here retrieves a past response, so there is no
      // reason to leave user queries stored on Perplexity's side.
      body: JSON.stringify({ preset: PERPLEXITY_PRESET, input: query, store: false }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch (error) {
    const name = error instanceof Error ? error.name : ''
    throw new PerplexityRequestError(name === 'TimeoutError' || name === 'AbortError' ? 'TIMEOUT' : 'NETWORK')
  }

  if (!response.ok) throw new PerplexityRequestError('HTTP_ERROR', response.status)

  try {
    return await response.json()
  } catch {
    throw new PerplexityRequestError('BAD_JSON', response.status)
  }
}
