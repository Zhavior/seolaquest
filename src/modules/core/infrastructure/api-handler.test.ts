import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AppError } from './errors'

const mocks = vi.hoisted(() => ({ warn: vi.fn(), error: vi.fn() }))

vi.mock('./logger', () => ({
  logger: { warn: mocks.warn, error: mocks.error },
  requestPath: (url: string) => new URL(url).pathname,
}))

import { withApiHandler } from './api-handler'

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
    expect(mocks.warn).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/items', issueCount: 1 }),
      'API request validation failed',
    )
    expect(JSON.stringify(mocks.warn.mock.calls)).not.toContain('private@example.com')
    expect(JSON.stringify(mocks.warn.mock.calls)).not.toContain('token=secret')
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
  })
})
