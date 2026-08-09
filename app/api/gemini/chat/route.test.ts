import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RateLimitError } from '@/src/modules/core/infrastructure/errors'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getGeminiClient: vi.fn(),
  getServerEnv: vi.fn(),
  generateContent: vi.fn(),
  enforce: vi.fn(),
  aiUsageCheck: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/gemini', () => ({ getGeminiClient: mocks.getGeminiClient }))
vi.mock('@/lib/env', () => ({ getServerEnv: mocks.getServerEnv }))
// Limiter internals are covered by RateLimiter.test.ts / AiUsageLimiter.test.ts; these cases
// exercise how the route reacts to their verdicts.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: mocks.enforce },
}))
vi.mock('@/src/modules/core/security/AiUsageLimiter', () => ({
  AiUsageLimiter: { check: mocks.aiUsageCheck },
}))

import { POST } from './route'

const context = { params: {} }

const jsonRequest = (body: unknown) =>
  new Request('https://seolaquest.test/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const rawRequest = (body: string) =>
  new Request('https://seolaquest.test/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

describe('gemini chat route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.getServerEnv.mockReturnValue({ GEMINI_API_KEY: 'server-owned-key', GEMINI_MODEL: 'gemini-2.5-flash' })
    mocks.getGeminiClient.mockReturnValue({ models: { generateContent: mocks.generateContent } })
    mocks.enforce.mockResolvedValue(undefined)
    mocks.aiUsageCheck.mockResolvedValue({ allowed: true })
    mocks.generateContent.mockResolvedValue({ text: 'Here is the answer.' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('rejects an unauthenticated caller before any billable work', async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null)

    const response = await POST(jsonRequest({ message: 'hi' }), context)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'UNAUTHORIZED' })
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('charges the ai tier against the authenticated user id and 429s when it is spent', async () => {
    mocks.enforce.mockImplementation(async ({ type }: { type?: string }) => {
      if (type === 'ai') {
        throw new RateLimitError('Rate limit exceeded. Please retry after the indicated delay.', {
          retryAfterSeconds: 42,
        })
      }
    })

    const response = await POST(jsonRequest({ message: 'hi' }), context)

    expect(mocks.enforce).toHaveBeenCalledWith({ type: 'ai', identifier: 'user-1' })
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('42')
    await expect(response.json()).resolves.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' })
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('stops a caller whose per-tenant AI spend budget is exhausted', async () => {
    mocks.aiUsageCheck.mockResolvedValue({
      allowed: false,
      reason: 'LIMITED',
      retryAt: new Date(Date.now() + 30_000),
    })

    const response = await POST(jsonRequest({ message: 'hi' }), context)

    expect(mocks.aiUsageCheck).toHaveBeenCalledWith('user-1')
    expect(response.status).toBe(429)
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('fails closed with 503 when the spend limiter cannot be consulted', async () => {
    mocks.aiUsageCheck.mockResolvedValue({ allowed: false, reason: 'UNAVAILABLE' })

    const response = await POST(jsonRequest({ message: 'hi' }), context)

    expect(response.status).toBe(503)
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('answers 503 when GEMINI_API_KEY is not configured', async () => {
    mocks.getGeminiClient.mockReturnValue(null)
    mocks.getServerEnv.mockReturnValue({ GEMINI_API_KEY: undefined, GEMINI_MODEL: undefined })

    const response = await POST(jsonRequest({ message: 'hi' }), context)

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('GEMINI_API_KEY'),
    })
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it.each([
    ['malformed', '{"message":'],
    ['empty', ''],
  ])('answers 400 for a %s body instead of a 500', async (_label, body) => {
    const response = await POST(rawRequest(body), context)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('answers 400 with the schema message when validation fails', async () => {
    const response = await POST(jsonRequest({ message: '   ' }), context)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Message cannot be empty.' })
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('answers 400 when the message exceeds the length ceiling', async () => {
    const response = await POST(jsonRequest({ message: 'x'.repeat(1001) }), context)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Message is too long (max 1000 characters).',
    })
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('answers 504 when the provider exceeds the 15s budget', async () => {
    vi.useFakeTimers()
    mocks.generateContent.mockReturnValue(new Promise(() => {}))

    const pending = POST(jsonRequest({ message: 'hi' }), context)
    await vi.advanceTimersByTimeAsync(15_000)
    const response = await pending

    expect(response.status).toBe(504)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('timed out'),
    })
  })

  it('answers 502 when the provider returns an empty or safety-blocked response', async () => {
    mocks.generateContent.mockResolvedValue({ text: '' })

    const response = await POST(jsonRequest({ message: 'hi' }), context)

    expect(response.status).toBe(502)
  })

  it('answers 500 when the provider itself errors', async () => {
    mocks.generateContent.mockRejectedValue(new Error('upstream exploded'))

    const response = await POST(jsonRequest({ message: 'hi' }), context)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(JSON.stringify(body)).not.toContain('upstream exploded')
  })

  it('returns the reply and forwards history to the model', async () => {
    const response = await POST(
      jsonRequest({
        message: 'What does Axion do?',
        history: [{ role: 'user', content: 'hello' }],
      }),
      context,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ reply: 'Here is the answer.' })
    expect(mocks.generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: 'hello' }] },
          { role: 'user', parts: [{ text: 'What does Axion do?' }] },
        ],
      }),
    )
  })
})
