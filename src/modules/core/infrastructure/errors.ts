export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean
  public readonly details?: unknown

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true // Indicates a known error (vs a programming bug)
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict detected', details?: unknown) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class DomainError extends AppError {
  constructor(message: string, code = 'DOMAIN_RULE_VIOLATION', details?: unknown) {
    super(message, 422, code, details)
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details?: unknown) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details)
  }
}

// `details` is typed `unknown` and is serialized straight to the client by withApiHandler,
// so anything a caller attaches crosses the trust boundary verbatim. Prisma errors carry
// `clientVersion`/`meta`/generated SQL, driver errors carry `errno`/`syscall`, and every
// Error carries a `stack` with absolute file paths. Details stay intact on the error object
// (server logs want the full picture) and are projected through this sanitizer only at the
// point of rendering a response.
const MAX_DETAIL_DEPTH = 3
const MAX_DETAIL_ENTRIES = 20
const MAX_DETAIL_STRING = 200

const UNSAFE_DETAIL_KEYS = new Set([
  'stack',
  'cause',
  'clientVersion',
  'meta',
  'errno',
  'syscall',
  'query',
  'sql',
  'parameters',
  'batchRequestIdx',
  'modelName',
  'target',
])

type SafeIssue = { path: string; code: string; message: string }

// Zod builds these default messages by interpolating the rejected input:
// `invalid_enum_value` renders as "Invalid enum value. Expected 'a' | 'b', received '<input>'".
// The message is replaced wholesale rather than pattern-stripped. Note this covers Zod's own
// defaults only — a custom `message` authored at the schema is trusted as authored.
const ISSUE_CODES_ECHOING_INPUT = new Set(['invalid_enum_value'])
const GENERIC_ISSUE_MESSAGE = 'Invalid value'

// Detected structurally rather than via `instanceof`/zod import: this must also catch the
// plain objects produced by `error.issues`/`error.errors` once they have crossed a boundary.
function asZodIssue(value: unknown): SafeIssue | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>
  if (!Array.isArray(candidate.path)) return null
  if (typeof candidate.code !== 'string' || typeof candidate.message !== 'string') return null

  // `received`, `expected`, `options`, `keys` and `unionErrors` are dropped: for literal and
  // enum issues `received` is the caller's raw rejected input, which we never echo back.
  return {
    path: candidate.path.map((segment) => String(segment)).join('.'),
    code: candidate.code,
    message: ISSUE_CODES_ECHOING_INPUT.has(candidate.code)
      ? GENERIC_ISSUE_MESSAGE
      : candidate.message.slice(0, MAX_DETAIL_STRING),
  }
}

function sanitize(value: unknown, depth: number): unknown {
  if (value === null) return null

  switch (typeof value) {
    case 'string':
      return value.slice(0, MAX_DETAIL_STRING)
    case 'number':
      return Number.isFinite(value) ? value : undefined
    case 'boolean':
      return value
    // Functions, symbols, bigints and undefined are not safely serializable.
    default:
      break
  }

  if (typeof value !== 'object') return undefined

  // An Error reaching `details` is a programming slip; its message and stack are internal.
  if (value instanceof Error) return undefined

  if (depth >= MAX_DETAIL_DEPTH) return undefined

  const issue = asZodIssue(value)
  if (issue) return issue

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_DETAIL_ENTRIES)
      .map((item) => sanitize(item, depth + 1))
      .filter((item) => item !== undefined)
    return items
  }

  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(source).slice(0, MAX_DETAIL_ENTRIES)) {
    if (UNSAFE_DETAIL_KEYS.has(key)) continue
    const sanitized = sanitize(source[key], depth + 1)
    if (sanitized !== undefined) result[key] = sanitized
  }
  return result
}

// Returns `undefined` when nothing survives, so the key is omitted from the response body
// rather than rendered as an empty husk.
export function sanitizeDetails(details: unknown): unknown {
  if (details === undefined || details === null) return undefined
  const sanitized = sanitize(details, 0)
  if (sanitized === undefined) return undefined
  if (typeof sanitized === 'object' && sanitized !== null && Object.keys(sanitized).length === 0) {
    return undefined
  }
  return sanitized
}

