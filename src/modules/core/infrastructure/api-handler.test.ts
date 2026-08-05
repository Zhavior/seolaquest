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

  it('returns a bare Internal Server Error when a raw Error escapes the handler', async () => {
    const raw = new Error(
      'connect ECONNREFUSED 10.0.3.14:5432 for user svc_billing on db coquest_prod',
    )
    const handler = withApiHandler(async () => {
      throw raw
    })

    const response = await handler(new Request('https://coquest.test/api/items'), { params: {} })
    const body = await response.json()

    expect(response.status).toBe(500)
    // Exact match: no `code`, no `details`, no `message`, no `stack` may ride along.
    expect(body).toEqual({ error: 'Internal Server Error' })
    expect(Object.keys(body)).toEqual(['error'])

    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain('ECONNREFUSED')
    expect(serialized).not.toContain('10.0.3.14')
    expect(serialized).not.toContain('svc_billing')
    expect(serialized).not.toContain('coquest_prod')
    expect(serialized).not.toContain('api-handler')
    for (const frame of (raw.stack ?? '').split('\n').slice(1, 4)) {
      expect(serialized).not.toContain(frame.trim())
    }
  })

  it('does not leak Prisma error metadata when a driver error escapes the handler', async () => {
    const prismaError = Object.assign(
      new Error('Invalid `prisma.user.findUnique()` invocation in /srv/app/lib/prisma.ts:14'),
      {
        code: 'P2002',
        clientVersion: '6.2.1',
        meta: { target: ['users_email_key'], modelName: 'User' },
      },
    )
    const handler = withApiHandler(async () => {
      throw prismaError
    })

    const response = await handler(new Request('https://coquest.test/api/items'), { params: {} })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal Server Error' })

    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain('P2002')
    expect(serialized).not.toContain('6.2.1')
    expect(serialized).not.toContain('users_email_key')
    expect(serialized).not.toContain('/srv/app')
  })

  it('strips internal metadata from the details of a 4xx AppError', async () => {
    const handler = withApiHandler(async () => {
      throw new AppError('Conflict detected', 409, 'CONFLICT', {
        field: 'email',
        stack: 'at Object.<anonymous> (/srv/app/src/modules/user.ts:42:11)',
        clientVersion: '6.2.1',
        meta: { target: ['users_email_key'] },
        cause: new Error('duplicate key value violates unique constraint'),
      })
    })

    const response = await handler(new Request('https://coquest.test/api/items'), { params: {} })
    const body = await response.json()

    expect(response.status).toBe(409)
    // The caller-facing field survives; every internal channel is dropped.
    expect(body).toEqual({
      error: 'Conflict detected',
      code: 'CONFLICT',
      details: { field: 'email' },
    })

    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain('/srv/app')
    expect(serialized).not.toContain('6.2.1')
    expect(serialized).not.toContain('users_email_key')
    expect(serialized).not.toContain('unique constraint')
  })

  it('omits details entirely when nothing survives sanitizing', async () => {
    const handler = withApiHandler(async () => {
      throw new AppError('Conflict detected', 409, 'CONFLICT', {
        stack: 'at Object.<anonymous> (/srv/app/src/modules/user.ts:42:11)',
      })
    })

    const response = await handler(new Request('https://coquest.test/api/items'), { params: {} })
    const body = await response.json()

    expect(body).toEqual({ error: 'Conflict detected', code: 'CONFLICT' })
    expect(body).not.toHaveProperty('details')
  })

  it('does not echo the rejected value back in validation details', async () => {
    const handler = withApiHandler(async () => {
      z.object({ plan: z.enum(['free', 'pro']) }).parse({ plan: 'admin@example.com' })
      throw new Error('unreachable')
    })

    const response = await handler(new Request('https://coquest.test/api/items'), { params: {} })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Validation failed')
    // Zod puts the caller's rejected input on `received` for enum failures.
    expect(JSON.stringify(body)).not.toContain('admin@example.com')
    expect(body.details).toEqual([
      { path: 'plan', code: 'invalid_enum_value', message: 'Invalid value' },
    ])
  })
})
