import { beforeEach, describe, expect, it, vi } from 'vitest'
import Anthropic from '@anthropic-ai/sdk'
import { RateLimitError } from '@/src/modules/core/infrastructure/errors'
import type { AuroraSemanticInput } from '../../types'

const mocks = vi.hoisted(() => ({
  getClaudeClient: vi.fn(),
  create: vi.fn(),
  enforce: vi.fn(),
}))

vi.mock('@/lib/anthropic', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/anthropic')>()),
  getClaudeClient: mocks.getClaudeClient,
}))
// Limiter internals are covered by RateLimiter.test.ts; these cases exercise how the
// classifier reacts to its verdict.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: mocks.enforce },
}))

import { ClaudeSemanticClassifier } from '../ClaudeSemanticClassifier'

const VALID_VERDICT = {
  relevance: 'HIGH',
  commercialIntent: true,
  intentCategory: 'PURCHASE',
  businessFit: 'HIGH',
  confidence: 0.82,
  reasons: ['Author asks for a recommendation', 'States a budget'],
}

const reply = (text: string, stop_reason = 'end_turn') => ({
  stop_reason,
  content: text ? [{ type: 'text', text }] : [],
})

const input = (overrides: Partial<AuroraSemanticInput> = {}): AuroraSemanticInput => ({
  opportunityId: 'opp-1',
  sourceEventId: 'evt-1',
  text: 'Looking to hire someone for SEO optimization',
  context: { userId: 'user-1', keywordPhrase: 'seo tools', platform: 'TWITTER' },
  ...overrides,
})

describe('ClaudeSemanticClassifier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.enforce.mockResolvedValue(undefined)
    mocks.getClaudeClient.mockReturnValue({ messages: { create: mocks.create } })
    mocks.create.mockResolvedValue(reply(JSON.stringify(VALID_VERDICT)))
  })

  it('returns the parsed verdict and asks for structured JSON', async () => {
    const result = await new ClaudeSemanticClassifier().classify(input())

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

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-5-5',
        output_config: expect.objectContaining({ format: expect.objectContaining({ type: 'json_schema' }) }),
      }),
      { timeout: 8_000, maxRetries: 0 },
    )
  })

  /**
   * The scorer adds 15 points for `businessFit === 'HIGH'` and nothing otherwise. The stub
   * this replaced emitted 'EXCELLENT', which reads as the best possible answer while scoring
   * identically to the worst. The response schema must not permit it back in.
   */
  it('rejects a verdict whose businessFit the policy scorer cannot read', async () => {
    mocks.create.mockResolvedValue(reply(JSON.stringify({ ...VALID_VERDICT, businessFit: 'EXCELLENT' })))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('VALIDATION_ERROR')
    expect(result.semanticSignals).toBeNull()
  })

  it('charges the tenant that owns the lead, not the caller', async () => {
    await new ClaudeSemanticClassifier().classify(input())

    expect(mocks.enforce).toHaveBeenCalledWith({ type: 'auroraClassify', identifier: 'user-1' })
  })

  it('refuses to classify at all when there is no tenant to meter against', async () => {
    const result = await new ClaudeSemanticClassifier().classify(input({ context: {} }))

    expect(result.failureCode).toBe('VALIDATION_ERROR')
    // The point of the guard: no metering means no provider call, not an unmetered one.
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('degrades instead of spending when the budget is exhausted', async () => {
    mocks.enforce.mockRejectedValue(new RateLimitError('Rate limit exceeded'))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('RATE_LIMITED')
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('degrades when the limiter itself cannot be consulted', async () => {
    // An unconsultable limiter must not become an unbounded spend.
    mocks.enforce.mockRejectedValue(new Error('redis unreachable'))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('RATE_LIMITED')
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('reports a configuration failure rather than throwing when Claude is unset', async () => {
    mocks.getClaudeClient.mockReturnValue(null)

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('PROVIDER_ERROR')
  })

  it.each([
    ['not valid JSON', 'not json at all'],
    ['an empty response', ''],
  ])('maps %s to MALFORMED_RESPONSE', async (_label, text) => {
    mocks.create.mockResolvedValue(reply(text))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('MALFORMED_RESPONSE')
    expect(result.semanticSignals).toBeNull()
  })

  it('maps a response missing required fields to VALIDATION_ERROR', async () => {
    mocks.create.mockResolvedValue(reply(JSON.stringify({ relevance: 'HIGH' })))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('VALIDATION_ERROR')
  })

  it('retries a transient network error exactly once, then succeeds', async () => {
    mocks.create
      .mockRejectedValueOnce(new Anthropic.APIConnectionError({ message: 'fetch failed' }))
      .mockResolvedValueOnce(reply(JSON.stringify(VALID_VERDICT)))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(mocks.create).toHaveBeenCalledTimes(2)
    expect(result.failureCode).toBeUndefined()
    expect(result.confidence).toBe(0.82)
  })

  it('gives up after one retry rather than looping', async () => {
    mocks.create.mockRejectedValue(new Anthropic.APIConnectionError({ message: 'fetch failed' }))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(mocks.create).toHaveBeenCalledTimes(2)
    expect(result.failureCode).toBe('PROVIDER_ERROR')
  })

  it('does not retry a 4xx, which would fail identically', async () => {
    // An auth or quota rejection is a statement about our request, not a blip.
    mocks.create.mockRejectedValue(Object.assign(new Error('forbidden'), { status: 403 }))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(result.failureCode).toBe('PROVIDER_ERROR')
  })

  it('reports the 8s timeout and does not retry into a second budget', async () => {
    mocks.create.mockRejectedValue(new Anthropic.APIConnectionTimeoutError({ message: 'timed out' }))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('TIMEOUT')
    expect(mocks.create).toHaveBeenCalledTimes(1)
  })

  it('treats a declined post as no signal, without retrying', async () => {
    mocks.create.mockResolvedValue(reply('', 'refusal'))

    const result = await new ClaudeSemanticClassifier().classify(input())

    expect(result.failureCode).toBe('MALFORMED_RESPONSE')
    expect(mocks.create).toHaveBeenCalledTimes(1)
  })

  it('never throws, so a failed classification is not an outbox retry', async () => {
    // AuroraService records FALLBACK from a returned failureCode. A throw would instead
    // dead-letter the event and re-bill the provider on every attempt.
    mocks.create.mockRejectedValue(new Error('boom'))

    await expect(new ClaudeSemanticClassifier().classify(input())).resolves.toMatchObject({
      failureCode: 'PROVIDER_ERROR',
    })
  })
})
