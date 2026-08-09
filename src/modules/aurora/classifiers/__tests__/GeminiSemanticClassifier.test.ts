import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RateLimitError } from '@/src/modules/core/infrastructure/errors'
import type { AuroraSemanticInput } from '../../types'

const mocks = vi.hoisted(() => ({
  getGeminiClient: vi.fn(),
  getServerEnv: vi.fn(),
  generateContent: vi.fn(),
  enforce: vi.fn(),
}))

vi.mock('@/lib/gemini', () => ({ getGeminiClient: mocks.getGeminiClient }))
vi.mock('@/lib/env', () => ({ getServerEnv: mocks.getServerEnv }))
// Limiter internals are covered by RateLimiter.test.ts; these cases exercise how the
// classifier reacts to its verdict.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: mocks.enforce },
}))

import { GeminiSemanticClassifier } from '../GeminiSemanticClassifier'

const VALID_VERDICT = {
  relevance: 'HIGH',
  commercialIntent: true,
  intentCategory: 'PURCHASE',
  businessFit: 'HIGH',
  confidence: 0.82,
  reasons: ['Author asks for a recommendation', 'States a budget'],
}

const input = (overrides: Partial<AuroraSemanticInput> = {}): AuroraSemanticInput => ({
  opportunityId: 'opp-1',
  sourceEventId: 'evt-1',
  text: 'Looking to hire someone for SEO optimization',
  context: { userId: 'user-1', keywordPhrase: 'seo tools', platform: 'TWITTER' },
  ...overrides,
})

describe('GeminiSemanticClassifier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.enforce.mockResolvedValue(undefined)
    mocks.getServerEnv.mockReturnValue({ GEMINI_MODEL: 'gemini-2.5-flash' })
    mocks.getGeminiClient.mockReturnValue({ models: { generateContent: mocks.generateContent } })
    mocks.generateContent.mockResolvedValue({ text: JSON.stringify(VALID_VERDICT) })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the parsed verdict and asks for structured JSON', async () => {
    const result = await new GeminiSemanticClassifier().classify(input())

    expect(result.failureCode).toBeUndefined()
    expect(result.confidence).toBe(0.82)
    expect(result.semanticSignals).toMatchObject({
      relevance: 'HIGH',
      commercialIntent: true,
      businessFit: 'HIGH',
    })
    // confidence and reasons are lifted out of the signals bag, not duplicated into it.
    expect(result.semanticSignals).not.toHaveProperty('confidence')
    expect(result.reasons).toEqual(VALID_VERDICT.reasons)

    expect(mocks.generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        config: expect.objectContaining({ responseMimeType: 'application/json' }),
      }),
    )
  })

  /**
   * The scorer adds 15 points for `businessFit === 'HIGH'` and nothing otherwise. The stub
   * this replaced emitted 'EXCELLENT', which reads as the best possible answer while scoring
   * identically to the worst. The response schema must not permit it back in.
   */
  it('rejects a verdict whose businessFit the policy scorer cannot read', async () => {
    mocks.generateContent.mockResolvedValue({
      text: JSON.stringify({ ...VALID_VERDICT, businessFit: 'EXCELLENT' }),
    })

    const result = await new GeminiSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('VALIDATION_ERROR')
    expect(result.semanticSignals).toBeNull()
  })

  it('charges the tenant that owns the lead, not the caller', async () => {
    await new GeminiSemanticClassifier().classify(input())

    expect(mocks.enforce).toHaveBeenCalledWith({ type: 'auroraClassify', identifier: 'user-1' })
  })

  it('refuses to classify at all when there is no tenant to meter against', async () => {
    const result = await new GeminiSemanticClassifier().classify(input({ context: {} }))

    expect(result.failureCode).toBe('VALIDATION_ERROR')
    // The point of the guard: no metering means no provider call, not an unmetered one.
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('degrades instead of spending when the budget is exhausted', async () => {
    mocks.enforce.mockRejectedValue(new RateLimitError('Rate limit exceeded'))

    const result = await new GeminiSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('RATE_LIMITED')
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('degrades when the limiter itself cannot be consulted', async () => {
    // An unconsultable limiter must not become an unbounded spend.
    mocks.enforce.mockRejectedValue(new Error('redis unreachable'))

    const result = await new GeminiSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('RATE_LIMITED')
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('reports a configuration failure rather than throwing when Gemini is unset', async () => {
    mocks.getGeminiClient.mockReturnValue(null)

    const result = await new GeminiSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('PROVIDER_ERROR')
  })

  it.each([
    ['not valid JSON', 'not json at all'],
    ['an empty response', ''],
  ])('maps %s to MALFORMED_RESPONSE', async (_label, text) => {
    mocks.generateContent.mockResolvedValue({ text })

    const result = await new GeminiSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('MALFORMED_RESPONSE')
    expect(result.semanticSignals).toBeNull()
  })

  it('maps a response missing required fields to VALIDATION_ERROR', async () => {
    mocks.generateContent.mockResolvedValue({ text: JSON.stringify({ relevance: 'HIGH' }) })

    const result = await new GeminiSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('VALIDATION_ERROR')
  })

  it('retries a transient network error exactly once, then succeeds', async () => {
    mocks.generateContent
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce({ text: JSON.stringify(VALID_VERDICT) })

    const result = await new GeminiSemanticClassifier().classify(input())

    expect(mocks.generateContent).toHaveBeenCalledTimes(2)
    expect(result.failureCode).toBeUndefined()
    expect(result.confidence).toBe(0.82)
  })

  it('gives up after one retry rather than looping', async () => {
    mocks.generateContent.mockRejectedValue(new TypeError('fetch failed'))

    const result = await new GeminiSemanticClassifier().classify(input())

    expect(mocks.generateContent).toHaveBeenCalledTimes(2)
    expect(result.failureCode).toBe('PROVIDER_ERROR')
  })

  it('does not retry a 4xx, which would fail identically', async () => {
    // An auth or quota rejection is a statement about our request, not a blip.
    mocks.generateContent.mockRejectedValue(Object.assign(new Error('forbidden'), { status: 403 }))

    const result = await new GeminiSemanticClassifier().classify(input())

    expect(mocks.generateContent).toHaveBeenCalledTimes(1)
    expect(result.failureCode).toBe('PROVIDER_ERROR')
  })

  it('times out at the 8s budget and does not retry into a second budget', async () => {
    vi.useFakeTimers()
    mocks.generateContent.mockReturnValue(new Promise(() => {}))

    const pending = new GeminiSemanticClassifier().classify(input())
    await vi.advanceTimersByTimeAsync(8_000)
    const result = await pending

    expect(result.failureCode).toBe('TIMEOUT')
    expect(mocks.generateContent).toHaveBeenCalledTimes(1)
  })

  it('never throws, so a failed classification is not an outbox retry', async () => {
    // AuroraService records FALLBACK from a returned failureCode. A throw would instead
    // dead-letter the event and re-bill the provider on every attempt.
    mocks.generateContent.mockRejectedValue(new Error('boom'))

    await expect(new GeminiSemanticClassifier().classify(input())).resolves.toMatchObject({
      failureCode: 'PROVIDER_ERROR',
    })
  })
})
