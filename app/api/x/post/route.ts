import { NextResponse } from 'next/server'
import { getXClient } from '@/lib/x'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { RateLimiterService } from '@/src/modules/core/security/RateLimiter'
import { AppError } from '@/src/modules/core/infrastructure/errors'
import { safeJson } from '@/src/modules/core/infrastructure/safeJson'
import { logger } from '@/src/modules/core/infrastructure/logger'

export const dynamic = 'force-dynamic'

/**
 * Posting here writes to the one connected X account, not to anything the
 * caller owns, so being signed in is not enough to authorize it. Sign-up is
 * public, which would otherwise make "any account" mean "anyone".
 *
 * Unset means nobody is allowed. The allowlist fails closed on purpose: an
 * empty variable in production must not read as "no restriction".
 */
function configuredPosterIds() {
  return new Set(
    (process.env.X_POST_ADMIN_USER_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )
}

const postSchema = z.object({
  text: z.string().trim().min(1, 'Post text cannot be empty.').max(280, 'Post text exceeds 280 characters.'),
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }
    if (!configuredPosterIds().has(user.id)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    if (process.env.NODE_ENV === 'production' && process.env.X_POSTING_ENABLED !== 'true') {
      return NextResponse.json({ error: 'X_POSTING_DISABLED' }, { status: 503 })
    }

    const xClient = getXClient()
    if (!xClient) {
      return NextResponse.json(
        { error: 'X API is not configured. Missing X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, or X_ACCESS_TOKEN_SECRET.' },
        { status: 503 }
      )
    }

    // safeJson raises ValidationError (400 VALIDATION_ERROR) for a malformed, empty or
    // oversized body, which the AppError branch below renders. The hand-rolled
    // request.json() try/catch this replaces could not reject an unbounded body at all:
    // `json()` buffers the whole payload before any schema runs.
    const parseResult = postSchema.safeParse(await safeJson(request))
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid post text.'
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { text } = parseResult.data

    /**
     * Distributed, per-admin budget. The previous module-scope timestamp array was
     * per-lambda-instance and reset on every cold start, so the enforced ceiling was
     * 5 x (number of live instances) rather than 5, and it was a single global counter
     * that let one admin starve the others.
     *
     * Kept after the allowlist check on purpose: a caller who is not an allowlisted
     * admin 403s above and never consumes anyone's budget. The identifier is the
     * authenticated user id — this route is never reachable anonymously, so there is
     * no IP fallback to get wrong. `xPost` is in HASHED_TYPES, so the id is HMAC'd
     * before it becomes a Redis key.
     *
     * Charged AFTER validation and immediately before the billable call, matching
     * AiUsageLimiter in app/api/gemini/chat. The budget meters posts actually sent to X,
     * and at 8 per 24h it is small enough that spending it on requests that never reach
     * X is a real outage: 8 malformed bodies from a buggy client used to lock the admin
     * out for a full day, with nothing posted. Only an allowlisted admin can get this
     * far, so the parse an over-budget caller can still force is both bounded (safeJson
     * caps the body at 64 KiB) and self-inflicted.
     */
    await RateLimiterService.enforce({ type: 'xPost', identifier: user.id })

    const response = await xClient.v2.tweet(text)
    if (!response || !response.data || !response.data.id) {
      logger.error(
        { event: 'x_post_failed', outcomeCode: 'X_RESPONSE_MISSING_ID' },
        'X accepted the request but returned no post id',
      )
      return NextResponse.json({ error: 'Failed to create post on X.' }, { status: 500 })
    }

    return NextResponse.json({
      id: response.data.id,
      text: response.data.text || text,
    })
  } catch (error: unknown) {
    /**
     * This route is intentionally not wrapped in withApiHandler, so the AppError ->
     * { error, code } rendering that the wrapper normally performs has to happen here.
     * RateLimiterService.enforce throws RateLimitError (an AppError, statusCode 429)
     * both when the budget is spent and when it fails closed in production.
     */
    if (error instanceof AppError) {
      logger.warn(
        { event: 'x_post_rejected', outcomeCode: error.code, statusCode: error.statusCode },
        'X post request rejected before reaching the X API',
      )
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      )
    }

    const err = error as { message?: string; code?: number }
    // Neither the post text nor the user id is logged: `text` is caller content and
    // LOG_REDACT_PATHS would censor `userId` anyway, so there is nothing to gain by
    // sending either through. The pino `err` serializer keeps only type/code/statusCode.
    logger.error(
      {
        err: error,
        event: 'x_post_failed',
        outcomeCode: err?.code === 429 ? 'X_API_RATE_LIMITED' : 'X_API_ERROR',
        ...(typeof err?.code === 'number' ? { providerStatus: err.code } : {}),
      },
      'Posting to X failed',
    )

    if (err?.code === 429) {
      return NextResponse.json({ error: 'X API rate limit reached. Try again later.' }, { status: 429 })
    }
    return NextResponse.json(
      { error: 'An error occurred while posting to X. Ensure your X API app has read/write permissions.' },
      { status: 500 }
    )
  }
}
