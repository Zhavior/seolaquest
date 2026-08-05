import { z } from 'zod'
import { ValidationError } from '@/src/modules/core/infrastructure/errors'

const idempotencyKeySchema = z
  .string()
  .min(8, 'Idempotency key must be at least 8 characters')
  .max(128, 'Idempotency key must not exceed 128 characters')
  .regex(/^[a-zA-Z0-9_\-]+$/, 'Idempotency key must be alphanumeric or hyphen/underscore')

export function extractIdempotencyKey(req: Request): string | null {
  const headerValue = req.headers.get('idempotency-key') ?? req.headers.get('x-idempotency-key')
  if (!headerValue) return null

  const trimmed = headerValue.trim()
  const parsed = idempotencyKeySchema.safeParse(trimmed)
  if (!parsed.success) {
    throw new ValidationError('Invalid Idempotency-Key header', parsed.error.issues)
  }

  return parsed.data
}
