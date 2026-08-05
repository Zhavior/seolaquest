import { describe, expect, it } from 'vitest'
import {
  AppError,
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
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
})
