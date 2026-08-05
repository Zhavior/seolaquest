import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  AppError,
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
  sanitizeDetails,
} from './errors'

describe('Typed Infrastructure Errors', () => {
  it('instantiates AppError with status code and operational flag', () => {
    const err = new AppError('Server error', 500, 'SERVER_ERROR')
    expect(err.message).toBe('Server error')
    expect(err.statusCode).toBe(500)
    expect(err.code).toBe('SERVER_ERROR')
    expect(err.isOperational).toBe(true)
  })

  it('instantiates ValidationError with 400 status code', () => {
    const err = new ValidationError('Invalid input', { field: 'email' })
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.details).toEqual({ field: 'email' })
  })

  it('instantiates UnauthorizedError with 401 status code', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('instantiates ForbiddenError with 403 status code', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
  })

  it('instantiates NotFoundError with 404 status code', () => {
    const err = new NotFoundError()
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
  })

  it('instantiates ConflictError with 409 status code', () => {
    const err = new ConflictError('Dedupe collision')
    expect(err.statusCode).toBe(409)
    expect(err.code).toBe('CONFLICT')
  })

  it('instantiates DomainError with 422 status code', () => {
    const err = new DomainError('Insufficient credits', 'INSUFFICIENT_CREDITS')
    expect(err.statusCode).toBe(422)
    expect(err.code).toBe('INSUFFICIENT_CREDITS')
  })

  it('instantiates RateLimitError with 429 status code', () => {
    const err = new RateLimitError()
    expect(err.statusCode).toBe(429)
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED')
  })

  it('keeps the unsanitized details on the error object for server-side logging', () => {
    const err = new ValidationError('Invalid input', { stack: 'internal', field: 'email' })
    expect(err.details).toEqual({ stack: 'internal', field: 'email' })
  })
})

describe('sanitizeDetails', () => {
  it('returns undefined for absent details', () => {
    expect(sanitizeDetails(undefined)).toBeUndefined()
    expect(sanitizeDetails(null)).toBeUndefined()
  })

  it('passes through caller-facing primitives and structure', () => {
    expect(sanitizeDetails({ field: 'email', attempts: 3, retryable: true })).toEqual({
      field: 'email',
      attempts: 3,
      retryable: true,
    })
  })

  it('drops stack traces, cause chains and Prisma driver metadata', () => {
    expect(
      sanitizeDetails({
        field: 'email',
        stack: 'at Object.<anonymous> (/srv/app/src/user.ts:42:11)',
        cause: new Error('duplicate key value violates unique constraint'),
        clientVersion: '6.2.1',
        meta: { target: ['users_email_key'] },
        modelName: 'User',
        errno: -61,
        syscall: 'connect',
        query: 'SELECT "public"."User"."id" FROM "public"."User"',
      }),
    ).toEqual({ field: 'email' })
  })

  it('drops a bare Error rather than exposing its message', () => {
    expect(sanitizeDetails(new Error('connect ECONNREFUSED 10.0.3.14:5432'))).toBeUndefined()
    expect(sanitizeDetails({ inner: new Error('ECONNREFUSED') })).toBeUndefined()
  })

  it('returns undefined when every key is stripped, so the field is omitted', () => {
    expect(sanitizeDetails({ stack: 'internal', clientVersion: '6.2.1' })).toBeUndefined()
    expect(sanitizeDetails({})).toBeUndefined()
  })

  it('projects Zod issues to path, code and message only', () => {
    const result = z.object({ value: z.number() }).safeParse({ value: 'private@example.com' })
    expect(result.success).toBe(false)
    if (result.success) return

    expect(sanitizeDetails(result.error.issues)).toEqual([
      { path: 'value', code: 'invalid_type', message: 'Expected number, received string' },
    ])
  })

  it('redacts the rejected input Zod interpolates into enum issue messages', () => {
    const result = z.object({ plan: z.enum(['free', 'pro']) }).safeParse({ plan: 'sk_live_abc123' })
    expect(result.success).toBe(false)
    if (result.success) return

    const sanitized = sanitizeDetails(result.error.issues)
    // Raw input reaches both `received` and the default message for this issue code.
    expect(sanitized).toEqual([{ path: 'plan', code: 'invalid_enum_value', message: 'Invalid value' }])
    expect(JSON.stringify(sanitized)).not.toContain('sk_live_abc123')
  })

  it('joins nested Zod issue paths', () => {
    const result = z
      .object({ user: z.object({ email: z.string().email() }) })
      .safeParse({ user: { email: 'nope' } })
    expect(result.success).toBe(false)
    if (result.success) return

    expect(sanitizeDetails(result.error.issues)).toEqual([
      { path: 'user.email', code: 'invalid_string', message: 'Invalid email' },
    ])
  })

  it('truncates long strings and caps collection size', () => {
    const sanitized = sanitizeDetails({ blob: 'x'.repeat(500) }) as { blob: string }
    expect(sanitized.blob).toHaveLength(200)

    const many = sanitizeDetails(Array.from({ length: 50 }, (_, i) => i)) as number[]
    expect(many).toHaveLength(20)
  })

  it('stops recursing past the depth cap', () => {
    expect(sanitizeDetails({ a: { b: { c: { d: 'too deep' } } } })).toEqual({ a: { b: {} } })
  })

  it('drops values that cannot be safely serialized', () => {
    expect(sanitizeDetails({ fn: () => 'x', sym: Symbol('s'), nan: NaN, ok: 'kept' })).toEqual({
      ok: 'kept',
    })
  })
})
