import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'
import { ZodError } from 'zod'

import { RateLimiterService, type RateLimiterType } from '../security/RateLimiter'
import { resolveClientIp } from './api-handler'
import { AppError, sanitizeDetails } from './errors'
import { logger, loggerContext } from './logger'

/**
 * Sentinel for a caller whose IP could not be established. Never used as a limiter
 * identifier for the caller's chosen tier — see the `unidentified` branch in the wrapper.
 */
const UNIDENTIFIED_CALLER = 'unidentified'

/**
 * The Server Action counterpart to `withApiHandler`.
 *
 * `withApiHandler` gives every Route Handler four things: an AsyncLocalStorage logging
 * context, a resolved caller identity, a rate limit, and a total mapping from thrown
 * errors to a safe response. Server Actions are a *larger* mutation surface than the API
 * routes — a Server Action is a POST endpoint reachable by anyone who can replay its
 * action id — and until now they had none of the four. This wrapper closes that gap.
 *
 * ## Why the result shape is what it is
 *
 * A Route Handler can answer with a `NextResponse`, so `withApiHandler` can express
 * "rejected" as a status code that never touches the handler's own return type. A Server
 * Action has no such channel: its return value *is* the response, and an uncaught throw is
 * not a 500 — React serializes it into an opaque `digest` and renders the nearest error
 * boundary, destroying the page the user was on. So the failure has to come back as data.
 *
 * The shape is `ServerActionFailure = { ok: false; code; message; details? }`, chosen to
 * match the `ActionResult = { ok: boolean; message?: string }` convention that already
 * dominates this repo's actions rather than inventing a competing envelope. That matters
 * because the alternative — wrapping every success in `{ ok: true, data }` — would rewrite
 * the contract of every existing call site, and these actions are consumed by
 * `useActionState`, by Clerk's `useReverification`, and by hand-rolled `.then()` chains
 * that read domain fields straight off the resolved value.
 *
 * Three actions predate that convention and return something else (`{ outcome }`,
 * `{ success }`, or raw domain data). For those, `onError` translates the failure into the
 * action's own shape, or `'rethrow'` preserves a throwing contract the caller already
 * handles. The wrapper is therefore never the reason a caller has to change.
 *
 * ## The redirect hazard
 *
 * `redirect()`, `permanentRedirect()` and `notFound()` are implemented as thrown errors
 * carrying a `digest` that Next.js itself unwinds. A `catch` that treats them as failures
 * silently breaks every navigation in the app. `unstable_rethrow` — the documented API for
 * exactly this — is the first statement in the catch block, before any classification. It
 * also rethrows the dynamic-rendering and PPR bailout signals, which are equally not ours
 * to swallow.
 */

export type ServerActionFailure = {
  ok: false
  code: string
  message: string
  details?: unknown
}

/**
 * How a caught error becomes a return value.
 *
 * - omitted: return `ServerActionFailure` as-is.
 * - a function: translate the failure into the action's own established shape.
 * - `'rethrow'`: log, then rethrow the original error untouched. For actions that return
 *   raw domain data (a list, a view model) and whose callers already treat a rejection as
 *   the failure signal — an envelope would be a type error at every one of those sites.
 */
export type ServerActionErrorPolicy<F> =
  | 'rethrow'
  | ((failure: ServerActionFailure, error: unknown) => F)

export interface ServerActionConfig<F = never> {
  /** Stable identifier for logs. Not shown to callers. */
  name: string
  /**
   * Rate limit tier. `billing` (10/min, hashed identifier) for anything that can move
   * money or provision paid capacity; `global` (100/min) for ordinary mutations.
   */
  tier?: RateLimiterType
  onError?: ServerActionErrorPolicy<F>
}

const GENERIC_FAILURE_MESSAGE = 'Something went wrong. Please try again.'

/**
 * Best-effort caller IP for the rate limit bucket. A Server Action has no `Request`
 * argument, so the identity has to come from the ambient request scope, which does not
 * exist under unit test or when an action is invoked outside a request. A missing IP must
 * not be fatal — the limiter still has `userId` for every authenticated caller, and
 * `RateLimiterService` itself decides how to behave when it cannot answer.
 *
 * Resolution is delegated to `resolveClientIp` rather than reading `x-forwarded-for`
 * directly. That header is a caller-appendable hop list, so reading it raw would let an
 * unauthenticated caller mint an unlimited number of buckets by varying it — and signed-out
 * actions fall back to exactly this value as their limiter identity. `x-real-ip` is
 * deliberately not consulted for the same reason. See the trust model on `resolveClientIp`.
 */
async function callerIp(): Promise<string> {
  try {
    const headerList = await headers()
    return resolveClientIp(headerList) ?? UNIDENTIFIED_CALLER
  } catch {
    return UNIDENTIFIED_CALLER
  }
}

/**
 * Resolved for the log context and the rate limit bucket only. This deliberately does not
 * *enforce* authentication: several wrapped actions answer a signed-out caller with a
 * specific, non-throwing result (`SIGNED_OUT`, "Your session has expired…") that the UI
 * renders, and hoisting a generic 401 up here would replace those messages. Authorization
 * stays where it already is — inside each action.
 */
async function callerUserId(): Promise<string | null> {
  try {
    const result = await auth()
    return result?.userId || null
  } catch {
    // The action may be invoked outside a Clerk-instrumented request scope.
    return null
  }
}

function classify(error: unknown, name: string): ServerActionFailure {
  if (error instanceof ZodError) {
    logger.warn(
      { event: 'server_action_validation_failed', action: name, issueCount: error.issues.length },
      'Server Action validation failed',
    )
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      // Raw issues carry the rejected input on `received` for literal and enum failures.
      details: sanitizeDetails(error.issues),
    }
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(
        { err: error, event: 'server_action_operational_error', action: name, statusCode: error.statusCode },
        'Server Action operational error',
      )
      // 5xx messages describe our internals. The caller gets the code and nothing else.
      return { ok: false, code: error.code, message: GENERIC_FAILURE_MESSAGE }
    }

    logger.warn(
      { event: 'server_action_rejected', action: name, code: error.code, statusCode: error.statusCode },
      'Server Action rejected',
    )
    // 4xx messages are authored by us and meant for the caller; `details` is
    // caller-supplied and is sanitized before it crosses the trust boundary.
    const details = sanitizeDetails(error.details)
    return {
      ok: false,
      code: error.code,
      message: error.message,
      ...(details === undefined ? {} : { details }),
    }
  }

  logger.error(
    { err: error, event: 'server_action_unhandled_error', action: name },
    'Unhandled Server Action exception',
  )
  return { ok: false, code: 'INTERNAL_ERROR', message: GENERIC_FAILURE_MESSAGE }
}

export function withServerAction<A extends unknown[], R>(
  config: ServerActionConfig<never> & { onError: 'rethrow' },
  handler: (...args: A) => Promise<R>,
): (...args: A) => Promise<R>

export function withServerAction<A extends unknown[], R, F>(
  config: ServerActionConfig<F> & {
    onError: (failure: ServerActionFailure, error: unknown) => F
  },
  handler: (...args: A) => Promise<R>,
): (...args: A) => Promise<R | F>

export function withServerAction<A extends unknown[], R>(
  config: ServerActionConfig<never>,
  handler: (...args: A) => Promise<R>,
): (...args: A) => Promise<R | ServerActionFailure>

export function withServerAction<A extends unknown[], R, F>(
  config: ServerActionConfig<F>,
  handler: (...args: A) => Promise<R>,
): (...args: A) => Promise<R | F | ServerActionFailure> {
  const { name, tier = 'global', onError } = config

  return async (...args: A) => {
    const requestId = crypto.randomUUID()
    const [userId, ip] = await Promise.all([callerUserId(), callerIp()])
    const store = { requestId, userId, action: name, ip }

    return loggerContext.run(store, async () => {
      try {
        // An unauthenticated caller collapses to their IP. `enforce` throws RateLimitError
        // when the budget is spent and — in production — when it cannot be consulted.
        //
        // With neither a userId nor a resolvable IP there is no identity to meter, so the
        // request goes to the shared `unidentified` tier rather than being charged to the
        // action's own tier under a constant key: that would give every anonymous caller a
        // combined budget at the action's rate, which for a signed-out-reachable action is
        // a free bucket for anyone who can strip a header. Mirrors withApiHandler.
        if (userId === null && ip === UNIDENTIFIED_CALLER) {
          await RateLimiterService.enforce({ type: 'unidentified', identifier: UNIDENTIFIED_CALLER })
        } else {
          await RateLimiterService.enforce({ type: tier, identifier: userId || ip })
        }

        return await handler(...args)
      } catch (error) {
        // MUST be first. redirect(), permanentRedirect(), notFound() and the dynamic
        // rendering bailouts are thrown control flow that Next.js unwinds itself; catching
        // them as failures breaks navigation everywhere.
        unstable_rethrow(error)

        const failure = classify(error, name)

        if (onError === 'rethrow') throw error
        if (typeof onError === 'function') return onError(failure, error)
        return failure
      }
    })
  }
}
