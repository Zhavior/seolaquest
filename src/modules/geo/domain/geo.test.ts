import { describe, expect, it } from 'vitest'
import { classifySource, normalizeBrandDomain } from './sourceType'
import { brandPresence, parseAgentResponse } from './parseAgentResponse'

describe('classifySource', () => {
  it.each([
    ['https://www.reddit.com/r/SEO/comments/abc/best_tool/', 'FORUM', 'KNOWN_DOMAIN'],
    ['https://old.reddit.com/r/SEO/', 'FORUM', 'KNOWN_DOMAIN'],
    ['https://www.g2.com/products/acme/reviews', 'AGGREGATOR', 'KNOWN_DOMAIN'],
    ['https://www.producthunt.com/posts/acme', 'AGGREGATOR', 'KNOWN_DOMAIN'],
    ['https://techcrunch.com/2026/01/01/acme/', 'EDITORIAL', 'KNOWN_DOMAIN'],
    ['https://someone.substack.com/p/tools', 'EDITORIAL', 'KNOWN_DOMAIN'],
    ['https://community.hubspot.com/t5/thread', 'FORUM', 'KNOWN_DOMAIN'],
    ['https://forum.acme.io/t/help', 'FORUM', 'URL_PATTERN'],
    ['https://acme.com/blog/best-seo-tools', 'EDITORIAL', 'URL_PATTERN'],
    ['https://blog.acme.com/post', 'EDITORIAL', 'URL_PATTERN'],
    ['https://acme.com/pricing', 'DIRECT', 'FALLBACK'],
    ['https://docs.acme.com/getting-started', 'DIRECT', 'FALLBACK'],
    ['not a url', 'DIRECT', 'FALLBACK'],
  ])('%s → %s (%s)', (url, sourceType, basis) => {
    expect(classifySource(url)).toEqual({ sourceType, basis })
  })

  it('does not treat a lookalike host as a known domain', () => {
    expect(classifySource('https://notreddit.com/x')).toEqual({ sourceType: 'DIRECT', basis: 'FALLBACK' })
  })
})

describe('normalizeBrandDomain', () => {
  it.each([
    ['acme.com', 'acme.com'],
    ['https://www.Acme.com/pricing', 'acme.com'],
    ['  app.acme.io ', 'app.acme.io'],
    ['localhost', null],
    ['', null],
    ['not a domain', null],
  ])('%j → %j', (input, expected) => {
    expect(normalizeBrandDomain(input)).toBe(expected)
  })
})

const response = {
  id: 'resp_1',
  model: 'perplexity/sonar',
  status: 'completed',
  output: [
    {
      type: 'search_results',
      queries: ['best seo tool'],
      results: [
        { id: 1, url: 'https://www.g2.com/categories/seo', title: 'G2 SEO', snippet: 'Reviews' },
        { id: 2, url: 'https://www.reddit.com/r/SEO/comments/x', title: 'Thread', snippet: 'Ask' },
        { id: 3, url: 'https://acme.com/features', title: 'Acme', snippet: 'Us' },
        { id: 4, url: 'https://rival.com/', title: 'Rival', snippet: 'Them' },
      ],
    },
    { type: 'function_call', name: 'ignored' },
    {
      type: 'message',
      id: 'msg_1',
      status: 'completed',
      role: 'assistant',
      content: [{ type: 'output_text', text: 'Rival leads [4]. Reviews agree [1][4].', annotations: [] }],
    },
  ],
  usage: {
    input_tokens: 1200,
    output_tokens: 300,
    total_tokens: 1500,
    cost: { currency: 'USD', input_cost: 0.0012, output_cost: 0.0003, tool_calls_cost: 0.005, total_cost: 0.0065 },
  },
}

describe('parseAgentResponse', () => {
  it('separates retrieved sources from cited ones and orders citations by first mention', () => {
    const parsed = parseAgentResponse(response)

    expect(parsed.sources.map((s) => [s.domain, s.retrievedRank, s.citedRank, s.sourceType])).toEqual([
      ['g2.com', 1, 2, 'AGGREGATOR'],
      ['reddit.com', 2, null, 'FORUM'],
      ['acme.com', 3, null, 'DIRECT'],
      ['rival.com', 4, 1, 'DIRECT'],
    ])
    expect(parsed.answerText).toBe('Rival leads [4]. Reviews agree [1][4].')
    expect(parsed.costUsd).toBe(0.0065)
    expect(parsed.inputTokens).toBe(1200)
    expect(parsed.outputTokens).toBe(300)
  })

  it('reads web:n markers and url_citation annotations, including URLs absent from results', () => {
    const parsed = parseAgentResponse({
      output: [
        { type: 'search_results', results: [{ id: 7, url: 'https://a.com/x', title: 'A', snippet: '' }] },
        {
          type: 'message',
          content: [
            {
              type: 'output_text',
              text: 'First [web:7]. Second.',
              annotations: [{ type: 'url_citation', url: 'https://b.com/y', start_index: 15 }],
            },
          ],
        },
      ],
    })

    expect(parsed.sources.map((s) => [s.url, s.retrievedRank, s.citedRank])).toEqual([
      ['https://a.com/x', 1, 1],
      ['https://b.com/y', null, 2],
    ])
    expect(parsed.costUsd).toBeNull()
  })

  it('rejects a payload with no output array shape', () => {
    expect(() => parseAgentResponse({ output: 'nope' })).toThrow()
  })
})

describe('brandPresence', () => {
  it('reports a brand retrieved but not cited', () => {
    const { sources } = parseAgentResponse(response)
    expect(brandPresence(sources, 'acme.com')).toEqual({ brandCited: false, brandCitedRank: null, brandRetrieved: true })
  })

  it('reports the best cited rank across subdomains', () => {
    const { sources } = parseAgentResponse(response)
    expect(brandPresence(sources, 'rival.com')).toEqual({ brandCited: true, brandCitedRank: 1, brandRetrieved: true })
    expect(brandPresence(sources, 'g2.com')).toEqual({ brandCited: true, brandCitedRank: 2, brandRetrieved: true })
  })

  it('reports absence', () => {
    const { sources } = parseAgentResponse(response)
    expect(brandPresence(sources, 'nobody.com')).toEqual({ brandCited: false, brandCitedRank: null, brandRetrieved: false })
  })
})
