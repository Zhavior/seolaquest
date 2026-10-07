/**
 * One real Perplexity scan from the terminal, without the database or sign-in.
 * Prints the classified sources, brand presence, and the engine-reported cost.
 *
 *   npx dotenv -e .env.local -- tsx scripts/geo-probe.ts "best seo tool for startups" acme.com
 *
 * Spends money: one Agent API call per run. Raw response is written to
 * .geo-probe-last.json (gitignored) so the parser can be checked against it.
 */
import { writeFileSync } from 'node:fs'
import { brandPresence, parseAgentResponse } from '../src/modules/geo/domain/parseAgentResponse'
import { normalizeBrandDomain } from '../src/modules/geo/domain/sourceType'

async function main() {
  const [query, domainArg] = process.argv.slice(2)
  const brandDomain = domainArg ? normalizeBrandDomain(domainArg) : null
  const apiKey = process.env.PERPLEXITY_API_KEY?.trim()
  if (!query || !brandDomain) throw new Error('Usage: tsx scripts/geo-probe.ts "<query>" <domain>')
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY is not set.')

  const startedAt = Date.now()
  // Same request as PerplexityAgentClient; that module is server-only so it is not imported here.
  const response = await fetch('https://api.perplexity.ai/v1/agent', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset: 'fast', input: query, store: false }),
    signal: AbortSignal.timeout(60_000),
  })
  const latencyMs = Date.now() - startedAt
  const raw = await response.json()
  writeFileSync('.geo-probe-last.json', JSON.stringify(raw, null, 2))
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(raw).slice(0, 500)}`)

  const parsed = parseAgentResponse(raw)
  console.log(`query:   ${query}`)
  console.log(`model:   ${parsed.model ?? 'UNKNOWN'}   latency: ${latencyMs} ms`)
  console.log(`tokens:  in ${parsed.inputTokens ?? 'UNKNOWN'} / out ${parsed.outputTokens ?? 'UNKNOWN'}`)
  console.log(`cost:    ${parsed.costUsd === null ? 'UNKNOWN (engine did not report usage.cost)' : `$${parsed.costUsd} USD`}`)
  console.log(`brand:   ${brandDomain} ${JSON.stringify(brandPresence(parsed.sources, brandDomain))}`)
  console.table(
    parsed.sources.map((s) => ({
      cited: s.citedRank ?? '',
      retrieved: s.retrievedRank ?? '',
      type: s.sourceType,
      basis: s.basis,
      domain: s.domain,
    })),
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
