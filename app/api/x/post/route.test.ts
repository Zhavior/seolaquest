import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RateLimitError } from '@/src/modules/core/infrastructure/errors'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getXClient: vi.fn(),
  tweet: vi.fn(),
  enforce: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/x', () => ({ getXClient: mocks.getXClient }))
// Limiter internals are covered by RateLimiter.test.ts; these cases exercise when the route
// asks for a charge, which is the part that decides whether an admin can lock themselves out.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: mocks.enforce },
}))

import { POST } from './route'

const ADMIN_ID = 'user-admin-1'
const originalPosterIds = process.env.X_POST_ADMIN_USER_IDS

const jsonRequest = (body: unknown) =>
  new Request('https://seolaquest.test/api/x/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const rawRequest = (body: string) =>
  new Request('https://seolaquest.test/api/x/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

describe('x post route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.X_POST_ADMIN_USER_IDS = ADMIN_ID
    mocks.getCurrentUser.mockResolvedValue({ id: ADMIN_ID })
    mocks.getXClient.mockReturnValue({ v2: { tweet: mocks.tweet } })
    mocks.enforce.mockResolvedValue(undefined)
    mocks.tweet.mockResolvedValue({ data: { id: '1234567890', text: 'hello' } })
  })

  afterEach(() => {
    if (originalPosterIds === undefined) delete process.env.X_POST_ADMIN_USER_IDS
    else process.env.X_POST_ADMIN_USER_IDS = originalPosterIds
  })

  it('rejects an unauthenticated caller without charging the budget', async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null)

    const response = await POST(jsonRequest({ text: 'hello' }))

    expect(response.status).toBe(401)
    expect(mocks.enforce).not.toHaveBeenCalled()
    expect(mocks.tweet).not.toHaveBeenCalled()
  })

  it('403s a signed-in non-admin without charging anyone', async () => {
    mocks.getCurrentUser.mockResolvedValueOnce({ id: 'user-stranger' })

    const response = await POST(jsonRequest({ text: 'hello' }))

    expect(response.status).toBe(403)
    // The identifier is the caller's own id, so a charge here would still not touch the
    // admin's bucket — but it would meter a request that can never post.
    expect(mocks.enforce).not.toHaveBeenCalled()
  })

  it('403s when the allowlist is unset, rather than treating empty as unrestricted', async () => {
    process.env.X_POST_ADMIN_USER_IDS = ''

    const response = await POST(jsonRequest({ text: 'hello' }))

    expect(response.status).toBe(403)
    expect(mocks.tweet).not.toHaveBeenCalled()
  })

  /**
   * THE LOCKOUT REGRESSION.
   *
   * The budget is 8 per 24 hours. Charging it before the body was validated meant 8
   * malformed or over-length requests from a buggy client spent the whole day's allowance
   * without a single post reaching X, and the admin could not post again until the window
   * rolled. Every case below must leave the budget untouched.
   */
  describe('does not spend the 8/24h budget on a request that never reaches X', () => {
    it.each([
      ['malformed JSON', rawRequest('{"text":')],
      ['an empty body', rawRequest('')],
      ['empty post text', jsonRequest({ text: '   ' })],
      ['text over 280 characters', jsonRequest({ text: 'x'.repeat(281) })],
      ['a missing text field', jsonRequest({ notText: 'hello' })],
    ])('rejects %s with 400 and no charge', async (_label, request) => {
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(mocks.enforce).not.toHaveBeenCalled()
      expect(mocks.tweet).not.toHaveBeenCalled()
    })

    it('leaves the budget intact across enough malformed requests to have exhausted it', async () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await POST(jsonRequest({ text: '' }))
        expect(response.status).toBe(400)
      }

      expect(mocks.enforce).not.toHaveBeenCalled()

      // The 9th request is valid, and must still be able to post.
      const response = await POST(jsonRequest({ text: 'the real post' }))

      expect(response.status).toBe(200)
      expect(mocks.enforce).toHaveBeenCalledTimes(1)
      expect(mocks.tweet).toHaveBeenCalledWith('the real post')
    })
  })

  it('rejects an oversized body as a 400 rather than buffering it or charging for it', async () => {
    // safeJson caps the body at 64 KiB. Before it was wired in, request.json() buffered
    // whatever the caller sent, and the charge had already happened.
    const response = await POST(jsonRequest({ text: 'x'.repeat(70 * 1024) }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(mocks.enforce).not.toHaveBeenCalled()
  })

  it('charges the xPost tier against the admin id once the request is known to be valid', async () => {
    const response = await POST(jsonRequest({ text: 'hello' }))

    expect(response.status).toBe(200)
    expect(mocks.enforce).toHaveBeenCalledWith({ type: 'xPost', identifier: ADMIN_ID })
  })

  it('429s and does not post when the budget is spent', async () => {
    mocks.enforce.mockRejectedValueOnce(
      new RateLimitError('Rate limit exceeded. Please retry after the indicated delay.'),
    )

    const response = await POST(jsonRequest({ text: 'hello' }))

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' })
    expect(mocks.tweet).not.toHaveBeenCalled()
  })

  it('503s when the X client is not configured, before any charge', async () => {
    mocks.getXClient.mockReturnValueOnce(null)

    const response = await POST(jsonRequest({ text: 'hello' }))

    expect(response.status).toBe(503)
    expect(mocks.enforce).not.toHaveBeenCalled()
  })

  it('returns the created post id on success', async () => {
    const response = await POST(jsonRequest({ text: 'hello' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: '1234567890', text: 'hello' })
  })

  it('answers 500 without leaking the provider error when X itself fails', async () => {
    mocks.tweet.mockRejectedValueOnce(new Error('x upstream exploded'))

    const response = await POST(jsonRequest({ text: 'hello' }))

    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('x upstream exploded')
  })
})
