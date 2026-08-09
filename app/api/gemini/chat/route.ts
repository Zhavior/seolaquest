import { NextResponse } from 'next/server'
import { getGeminiClient } from '@/lib/gemini'
import { getServerEnv } from '@/lib/env'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { safeJson } from '@/src/modules/core/infrastructure/safeJson'
import { RateLimitError } from '@/src/modules/core/infrastructure/errors'
import { RateLimiterService } from '@/src/modules/core/security/RateLimiter'
import { AiUsageLimiter } from '@/src/modules/core/security/AiUsageLimiter'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const chatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().max(2000),
})

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty.').max(1000, 'Message is too long (max 1000 characters).'),
  history: z.array(chatMessageSchema).max(20).optional().default([]),
})

const SYSTEM_INSTRUCTION =
  'You are Axion’s helpful product assistant. Be concise, practical, accurate, and never claim you completed an action you cannot verify.'

const TIMEOUT_MS = 15000

/**
 * Distinguishes "we gave up waiting" (504) from "the provider failed" (500) without matching
 * on an error message string, which the SDK is free to reuse for something else.
 */
class GeminiTimeoutError extends Error {
  constructor() {
    super('Gemini request timed out')
    this.name = 'GeminiTimeoutError'
  }
}

/** RFC 9110 Retry-After is a whole-second delta and must never round down to zero. */
function retryAfterSecondsUntil(retryAt: Date | undefined): number | undefined {
  if (!retryAt) return undefined
  const seconds = Math.ceil((retryAt.getTime() - Date.now()) / 1000)
  return Number.isFinite(seconds) ? Math.max(1, seconds) : undefined
}

export const POST = withApiHandler(async (request) => {
  // Clerk middleware already rejects anonymous callers (see proxy.ts), but the
  // spend here lands on our Gemini account, so the route states the
  // requirement itself rather than inheriting it from the route matcher.
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const ai = getGeminiClient()
  const env = getServerEnv()

  if (!ai || !env.GEMINI_API_KEY) {
    logger.error(
      { event: 'gemini_chat_unconfigured', outcomeCode: 'GEMINI_CHAT_NOT_CONFIGURED' },
      'Gemini chat is not configured',
    )
    return NextResponse.json(
      { error: 'Gemini API is not configured. Missing GEMINI_API_KEY environment variable.' },
      { status: 503 }
    )
  }

  /**
   * Per-account RATE brake, on top of the global/ip tiers withApiHandler already charged.
   * Those two are keyed on an IP or a userId with a 100-300/min allowance sized for ordinary
   * API traffic; neither is a meaningful bound on an endpoint where every request bills a
   * generateContent call against OUR key and sign-up is public. `ai` is the tier sized for
   * that (20/h, see LIMITER_CONFIG), and the identifier is the authenticated user id so a
   * caller cannot multiply their allowance by rotating networks. `ai` is in HASHED_TYPES,
   * so the id is HMAC'd before it becomes a Redis key.
   *
   * Charged before the body is read: sign-up is public, so this route is reachable by
   * anyone who registers, and a caller who is over budget must not be able to make us
   * buffer and parse their payload first.
   *
   * app/api/x/post deliberately does the opposite and charges after validation. The
   * tradeoff differs there: that route is allowlist-only, so the parse can only ever be
   * forced by an admin, and its budget is 8/24h — small enough that spending it on
   * requests that never reach X locks the admin out for a day. The per-request AI budget
   * below (AiUsageLimiter) follows that same after-validation rule for the same reason.
   */
  await RateLimiterService.enforce({ type: 'ai', identifier: user.id })

  // safeJson raises ValidationError (400 VALIDATION_ERROR) for a malformed, empty or
  // oversized body, which withApiHandler renders — the hand-rolled request.json() try/catch
  // this replaces could not reject an unbounded body at all.
  const parseResult = chatRequestSchema.safeParse(await safeJson(request))
  if (!parseResult.success) {
    // Issue count only: the raw issues carry the rejected input on `received`.
    logger.warn(
      {
        event: 'gemini_chat_validation_failed',
        outcomeCode: 'GEMINI_CHAT_INVALID_REQUEST',
        issueCount: parseResult.error.issues.length,
      },
      'Gemini chat request validation failed',
    )
    // The schema's own messages are written for the chat user and are what the UI renders,
    // so they are returned verbatim rather than flattened into a generic "Validation failed".
    const errorMessage = parseResult.error.issues[0]?.message || 'Invalid chat parameters.'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }

  const { message, history } = parseResult.data
  const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash'

  /**
   * Per-tenant SPEND cap. This is a different control from the `ai` tier above and both are
   * needed: `ai` bounds the RATE (20/h) so no single account can burst; AiUsageLimiter bounds
   * the daily VOLUME of billable AI calls that one tenant can accumulate, which is the number
   * that actually shows up on the invoice. It is the same limiter LeadService already uses,
   * so a tenant has one AI budget across the product rather than one per feature.
   *
   * Charged here, after validation and immediately before the billable call, so a rejected
   * payload never draws down the budget.
   */
  const usage = await AiUsageLimiter.check(user.id)
  if (!usage.allowed) {
    if (usage.reason === 'LIMITED') {
      logger.warn(
        { event: 'gemini_chat_spend_limited', outcomeCode: 'GEMINI_CHAT_AI_BUDGET_EXHAUSTED' },
        'Gemini chat blocked by the per-tenant AI usage budget',
      )
      // RateLimitError so withApiHandler renders the 429 and the Retry-After header through
      // the same path as RateLimiterService, instead of a parallel rendering here.
      throw new RateLimitError('Daily AI usage limit reached. Try again after the limit resets.', {
        retryAfterSeconds: retryAfterSecondsUntil(usage.retryAt),
      })
    }

    // The limiter could not be consulted, so it fails closed: we cannot tell whether this
    // request is inside the budget, and guessing "yes" is the failure mode that costs money.
    logger.error(
      { event: 'gemini_chat_spend_limiter_unavailable', outcomeCode: 'GEMINI_CHAT_BUDGET_UNAVAILABLE' },
      'Gemini chat blocked because the AI usage limiter is unavailable',
    )
    return NextResponse.json(
      { error: 'AI chat is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    )
  }

  // Format contents for @google/genai SDK
  const contents = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: message }],
    },
  ]

  // Timeout protection via Promise.race
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new GeminiTimeoutError()), TIMEOUT_MS)
  })

  const apiPromise = ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  })

  let text: string | undefined
  try {
    const response = await Promise.race([apiPromise, timeoutPromise])
    text = response.text
  } catch (error: unknown) {
    const timedOut = error instanceof GeminiTimeoutError

    // Scoped to the provider call on purpose: a RateLimitError or ValidationError raised
    // above must reach withApiHandler untouched rather than be relabelled a Gemini failure.
    logger.error(
      {
        err: error,
        event: 'gemini_chat_failed',
        outcomeCode: timedOut ? 'GEMINI_CHAT_TIMED_OUT' : 'GEMINI_CHAT_FAILED',
      },
      'Gemini chat request failed',
    )

    if (timedOut) {
      return NextResponse.json({ error: 'Gemini API request timed out. Please try again.' }, { status: 504 })
    }
    return NextResponse.json(
      { error: 'An error occurred while generating a response from Gemini.' },
      { status: 500 }
    )
  } finally {
    // Without this the pending timer keeps the function alive for the rest of the 15s even
    // when the provider answered immediately.
    if (timer) clearTimeout(timer)
  }

  if (!text) {
    logger.warn(
      { event: 'gemini_chat_empty_response', outcomeCode: 'GEMINI_CHAT_EMPTY_RESPONSE', model: modelName },
      'Gemini returned an empty or blocked response',
    )
    return NextResponse.json(
      { error: 'Received an empty response from Gemini API or content was blocked by safety filters.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ reply: text })
})
