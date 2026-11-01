// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClaudeScanRequestError, runClaudeScan } from './ClaudeScanClient'

const message = (stop_reason: string, content: unknown[], webSearches = 1) =>
  new Response(
    JSON.stringify({
      id: 'msg_1',
      type: 'message',
      role: 'assistant',
      model: 'claude-sonnet-5-5',
      stop_reason,
      content,
      usage: { input_tokens: 100, output_tokens: 20, server_tool_use: { web_search_requests: webSearches } },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )

describe('runClaudeScan', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('asks Sonnet with web search on, sends only the query, and does not fall back to another model', async () => {
    const fetchMock = vi.fn().mockResolvedValue(message('end_turn', [{ type: 'text', text: 'Answer.' }]))
    vi.stubGlobal('fetch', fetchMock)

    await runClaudeScan('best crm for agencies', 'test-key')

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({
      model: 'claude-sonnet-5-5',
      messages: [{ role: 'user', content: 'best crm for agencies' }],
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],
    })
    expect(body).not.toHaveProperty('fallbacks')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('resumes a paused search and merges content and usage across turns', async () => {
    const first = [{ type: 'server_tool_use', id: 'srv_1', name: 'web_search', input: {} }]
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(message('pause_turn', first))
      .mockResolvedValueOnce(message('end_turn', [{ type: 'text', text: 'Done.' }]))
    vi.stubGlobal('fetch', fetchMock)

    const result = (await runClaudeScan('q', 'test-key')) as {
      content: unknown[]
      usage: Record<string, number>
    }

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).messages[1]).toEqual({ role: 'assistant', content: first })
    expect(result.content).toHaveLength(2)
    expect(result.usage).toEqual({ input_tokens: 200, output_tokens: 40, web_search_requests: 2 })
  })

  it('stops after three paused turns rather than spending without end', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => message('pause_turn', [])))

    await expect(runClaudeScan('q', 'test-key')).rejects.toMatchObject({ code: 'UNFINISHED' })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('fails a cut-off answer rather than scoring the citations it reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(message('max_tokens', [{ type: 'text', text: 'Partial' }])))

    await expect(runClaudeScan('q', 'test-key')).rejects.toMatchObject({ code: 'UNFINISHED' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('names a refusal instead of returning an empty answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(message('refusal', [])))

    await expect(runClaudeScan('q', 'test-key')).rejects.toMatchObject({ code: 'REFUSED' })
  })

  it('reports the HTTP status and does not retry a paid call', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'busy' } }), {
        status: 529,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const error = await runClaudeScan('q', 'test-key').catch((e) => e)

    expect(error).toBeInstanceOf(ClaudeScanRequestError)
    expect(error).toMatchObject({ code: 'HTTP_ERROR', httpStatus: 529 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
