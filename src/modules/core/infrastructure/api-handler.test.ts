import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AppError } from './errors'

// Rate limiting is covered by RateLimiter.test.ts; these cases exercise the wrapper.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

import { baseLogger } from './logger'
import { withApiHandler } from './api-handler'

// `logger` is a Proxy that merges the AsyncLocalStorage request context (requestId, path,
// ip, userId) into every call before delegating to baseLogger. Spying on baseLogger rather
// than mocking `logger` keeps that merge under test instead of reimplementing it here.
const warn = vi.spyOn(baseLogger, 'warn').mockImplementation(() => undefined)
const error = vi.spyOn(baseLogger, 'error').mockImplementation(() => undefined)

describe('withApiHandler logging and disclosure', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not log query strings or rejected values for validation failures', async () => {
    const handler = withApiHandler(async () => {
      z.object({ value: z.number() }).parse({ value: 'private@example.com' })
      throw new Error('unreachable')
    })

    const response = await handler(
      new Request('https://coquest.test/api/items?token=secret'),
      { params: {} },
    )

    expect(response.status).toBe(400)
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/items', issueCount: 1 }),
      'API request validation failed',
    )
    expect(JSON.stringify(warn.mock.calls)).not.toContain('private@example.com')
    expect(JSON.stringify(warn.mock.calls)).not.toContain('token=secret')
  })

  it('attaches the request context to every log line', async () => {
    const handler = withApiHandler(async () => {
      throw new AppError('rejected', 409, 'CONFLICT')
    })

    await handler(new Request('https://coquest.test/api/items'), { params: {} })

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/items',
        requestId: expect.any(String),
        code: 'CONFLICT',
      }),
      'API request rejected',
    )
  })

  it('does not expose internal AppError messages or details', async () => {
    const handler = withApiHandler(async () => {
      throw new AppError('database secret leaked', 503, 'DEPENDENCY_FAILED', { token: 'secret' })
    })

    const response = await handler(new Request('https://coquest.test/api/items'), { params: {} })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Internal Server Error',
      code: 'DEPENDENCY_FAILED',
    })
    expect(JSON.stringify(error.mock.calls)).not.toContain('database secret leaked')
  })
})
