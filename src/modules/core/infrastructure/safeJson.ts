import { ValidationError } from './errors'

/**
 * Hard ceiling on a JSON request body.
 *
 * Every mutating route in this app carries a handful of short scalar fields, so 64 KiB is
 * orders of magnitude above any legitimate payload. The cap exists because `Request.json()`
 * buffers the whole body before any schema runs: without it, a caller can force an unbounded
 * allocation and a full UTF-8 parse *before* zod ever gets a chance to reject the shape.
 */
export const MAX_JSON_BODY_BYTES = 64 * 1024

/**
 * Parse a JSON request body without ever letting a client-side mistake surface as a 500.
 *
 * `await req.json()` throws a bare `SyntaxError` on malformed or empty input. `SyntaxError` is
 * neither a `ZodError` nor an `AppError`, so it falls through to the generic branch in
 * withApiHandler and renders `{ error: 'Internal Server Error' }` with status 500 — telling the
 * caller we broke when in fact they did. Every failure mode here is the caller's, so every one
 * of them maps to `ValidationError` (400, code VALIDATION_ERROR) through the existing AppError
 * path.
 *
 * Returns `unknown` on purpose: the caller must run it through a zod schema before use.
 */
export async function safeJson(req: Request): Promise<unknown> {
  // Reject an oversized body on its declared length first, so the honest-but-huge case never
  // gets buffered at all. A lying or absent Content-Length is caught by the post-read check.
  const declaredLength = Number(req.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    throw new ValidationError('Request body is too large')
  }

  let raw: string
  try {
    raw = await req.text()
  } catch {
    throw new ValidationError('Request body could not be read')
  }

  if (new TextEncoder().encode(raw).byteLength > MAX_JSON_BODY_BYTES) {
    throw new ValidationError('Request body is too large')
  }

  if (raw.trim().length === 0) {
    throw new ValidationError('Request body is required')
  }

  try {
    return JSON.parse(raw)
  } catch {
    throw new ValidationError('Malformed JSON body')
  }
}
