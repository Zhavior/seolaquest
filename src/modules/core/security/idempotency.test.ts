import { describe, expect, it } from 'vitest'
import { extractIdempotencyKey } from './idempotency'
import { ValidationError } from '@/src/modules/core/infrastructure/errors'

describe('extractIdempotencyKey', () => {
  it('returns null when no idempotency header is present', () => {
    const req = new Request('https://example.com/api/v1/scan', { method: 'POST' })
    expect(extractIdempotencyKey(req)).toBeNull()
  })

  it('extracts valid Idempotency-Key header', () => {
    const req = new Request('https://example.com/api/v1/scan', {
      method: 'POST',
      headers: { 'idempotency-key': 'idem-key-12345678' },
    })
    expect(extractIdempotencyKey(req)).toBe('idem-key-12345678')
  })

  it('extracts valid x-idempotency-key fallback header', () => {
    const req = new Request('https://example.com/api/v1/scan', {
      method: 'POST',
      headers: { 'x-idempotency-key': 'x-idem-87654321' },
    })
    expect(extractIdempotencyKey(req)).toBe('x-idem-87654321')
  })

  it('throws ValidationError for too short idempotency key', () => {
    const req = new Request('https://example.com/api/v1/scan', {
      method: 'POST',
      headers: { 'idempotency-key': 'short' },
    })
    expect(() => extractIdempotencyKey(req)).toThrow(ValidationError)
  })

  it('throws ValidationError for invalid characters', () => {
    const req = new Request('https://example.com/api/v1/scan', {
      method: 'POST',
      headers: { 'idempotency-key': 'invalid key with spaces!' },
    })
    expect(() => extractIdempotencyKey(req)).toThrow(ValidationError)
  })
})
