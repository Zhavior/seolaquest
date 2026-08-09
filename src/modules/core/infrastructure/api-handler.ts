import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger, requestPath, loggerContext } from './logger'
import { AppError, RateLimitError, sanitizeDetails } from './errors'
import { auth } from '@clerk/nextjs/server'
import { RateLimiterService } from '../security/RateLimiter'

/**
 * TRUST MODEL FOR `x-forwarded-for`
 * ---------------------------------
 * `x-forwarded-for` is a comma-separated trace, oldest hop first, and every hop is free to
 * append. Anything a client sends arrives intact at the left of the list, so the LEFTMOST
 * entries are caller-authored and worthless for identity: reading them lets an attacker mint
 * an unlimited number of fresh buckets (`x-forwarded-for: <random>`) or park their traffic in
 * a victim's bucket (`x-forwarded-for: <victim ip>`).
 *
 * Only entries appended by infrastructure we control are trustworthy, and those are at the
 * RIGHT. This deployment is Vercel: Vercel's edge appends the TCP peer address of the
 * connection it terminated as the last element and there is no proxy of ours behind it, so
 * TRUSTED_PROXY_HOPS is 0 and the correct value is the last element of the list.
 *
 * TRUSTED_PROXY_HOPS is the count of proxies WE operate that append their own entry after
 * Vercel's. Raise it by exactly one for each such hop introduced (e.g. an internal gateway in
 * front of the function). Setting it too high walks left into caller-controlled territory and
 * reintroduces the spoof, so it must never be a guess.
 *
 * @vercel/functions is not a dependency of this project and is deliberately not added, so the
 * selection is implemented here.
 *
 * Deliberately absent: `x-real-ip`. On a request that reached us through Vercel,
 * `x-forwarded-for` is always present, so `x-real-ip` adds nothing; anywhere it is absent,
 * `x-real-ip` is just another header the caller can set. Treating it as a fallback would hand
 * back the exact bypass this function exists to close.
 *
 * There is also no walk-left-until-something-parses fallback. If the selected hop is not an
 * address, the request is UNIDENTIFIED rather than attributed to a neighbouring value — a
 * fallback scan is itself a spoofing primitive.
 */
const TRUSTED_PROXY_HOPS = 0

/** Guards against a pathologically long header turning parsing into the attack. */
const MAX_FORWARDED_FOR_LENGTH = 2048

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/

function isIpv6(value: string): boolean {
  const halves = value.split('::')
  if (halves.length > 2) return false
  const compressed = halves.length === 2

  const parseHalf = (segment: string): string[] | null => {
    if (segment === '') return []
    const groups = segment.split(':')
    return groups.some((group) => group === '') ? null : groups
  }

  const left = parseHalf(halves[0])
  const right = parseHalf(compressed ? halves[1] : '')
  if (!left || !right) return false

  const groups = [...left, ...right]
  let count = groups.length

  // A trailing IPv4 literal (`::ffff:203.0.113.4`) occupies two of the eight groups.
  const last = groups[groups.length - 1]
  if (last !== undefined && last.includes('.')) {
    if (!IPV4_PATTERN.test(last)) return false
    groups.pop()
    count += 1
  }

  if (groups.some((group) => !/^[0-9a-fA-F]{1,4}$/.test(group))) return false
  return compressed ? count <= 7 : count === 8
}

/**
 * Normalizes one hop to a bare IP address, or null if it is not one. Obfuscated identifiers
 * (`unknown`, `_secret`), hostnames and junk all return null: a non-IP value must never
 * become a bucket key, because it is by definition something the caller could have authored.
 */
function normalizeHop(raw: string): string | null {
  let value = raw.trim()
  if (!value) return null

  const bracketed = /^\[([^\]]+)\](?::\d{1,5})?$/.exec(value)
  if (bracketed) {
    // `[2001:db8::1]:443`
    value = bracketed[1]
  } else if (value.includes(':') && !value.includes('::')) {
    // `203.0.113.4:443`. An uncompressed IPv6 also contains ':' but never leads with a
    // dot-quad, so only strip a port when the head is itself a valid IPv4 address.
    const head = value.slice(0, value.indexOf(':'))
    if (IPV4_PATTERN.test(head)) value = head
  }

  // RFC 4007 zone id (`fe80::1%eth0`) is link-local scope, not part of the address.
  const zone = value.indexOf('%')
  if (zone !== -1) value = value.slice(0, zone)

  if (IPV4_PATTERN.test(value)) return value
  if (isIpv6(value)) return value.toLowerCase()
  return null
}

/**
 * The client IP this platform actually vouches for, or null when it cannot be established.
 * Null is never coerced into a placeholder bucket key here — the caller routes it to the
 * tight `unidentified` tier instead.
 */
export function resolveClientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (!forwarded || forwarded.length > MAX_FORWARDED_FOR_LENGTH) return null

  const hops = forwarded.split(',')
  const index = hops.length - 1 - TRUSTED_PROXY_HOPS
  if (index < 0) return null

  return normalizeHop(hops[index])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler<T = any> = (
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: any }
) => Promise<NextResponse<T>> | NextResponse<T>

// T is intentionally left at its `any` default rather than inferred from the handler:
// routes legitimately return several response shapes (success DTO, 401, 422, ...) and
// inferring T from the first branch would reject every multi-shape route.
export function withApiHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    const path = requestPath(req.url)
    const requestId = crypto.randomUUID()
    const ip = resolveClientIp(req.headers)

    // Mutable on purpose: the same object backs the AsyncLocalStorage store, so filling in
    // userId after auth() resolves retro-fits it onto every log line for the rest of the
    // request without re-entering the context.
    const store: { requestId: string; userId: string | null; path: string; ip: string } = {
      requestId,
      userId: null,
      path,
      ip: ip ?? 'unidentified',
    }

    return loggerContext.run(store, async () => {
      try {
        // Coarse pre-authentication brake. This runs BEFORE auth() so a flood is rejected
        // without paying a Clerk round trip per request. An unresolvable IP cannot be given
        // the normal per-IP allowance (that would be a free bucket for anyone who can strip a
        // header), so it goes to its own much tighter shared tier instead.
        if (ip) {
          await RateLimiterService.enforce({ type: 'ip', identifier: ip })
        } else {
          await RateLimiterService.enforce({ type: 'unidentified', identifier: 'no-client-ip' })
        }

        // Retrieve userId conditionally, it might throw if outside clerk middleware context,
        // but in Next.js App Router we can just await auth()
        let userId: string | null = null
        try {
          const authResult = await auth()
          userId = authResult?.userId || null
        } catch {
          // Ignored: route might not be protected or clerk is not configured
        }
        store.userId = userId

        // Finer per-identity limit: a signed-in caller is metered by userId so they cannot
        // multiply their allowance by changing networks. With neither a userId nor an IP the
        // `unidentified` tier above is already the binding constraint, so there is nothing
        // left to key on and re-charging it would just halve that bucket.
        const identifier = userId ?? ip
        if (identifier) {
          await RateLimiterService.enforce({ type: 'global', identifier })
        }

        return await handler(req, context)
      } catch (error) {
        if (error instanceof ZodError) {
          logger.warn(
            { event: 'api_validation_failed', issueCount: error.issues.length },
            'API request validation failed',
          )
          return NextResponse.json(
            {
              error: 'Validation failed',
              // Projected to path/code/message: raw issues carry the rejected input on
              // `received` for literal and enum failures.
              details: sanitizeDetails(error.issues),
            },
            { status: 400 }
          )
        }

        if (error instanceof AppError) {
          if (error.statusCode >= 500) {
            logger.error(
              { err: error, event: 'api_operational_error', statusCode: error.statusCode },
              'API operational error',
            )
          } else {
            logger.warn(
              { event: 'api_request_rejected', code: error.code, statusCode: error.statusCode },
              'API request rejected',
            )
          }

          if (error.statusCode >= 500) {
            return NextResponse.json(
              { error: 'Internal Server Error', code: error.code },
              { status: error.statusCode },
            )
          }

          // 4xx messages are authored by us and are meant for the caller; `details` is
          // caller-supplied and is sanitized before it crosses the trust boundary.
          const details = sanitizeDetails(error.details)
          return NextResponse.json(
            {
              error: error.message,
              code: error.code,
              ...(details === undefined ? {} : { details }),
            },
            { status: error.statusCode, headers: retryAfterHeader(error) }
          )
        }

        // Unhandled generic errors (e.g., SyntaxError, TypeError, Prisma errors)
        logger.error({ err: error, event: 'api_unhandled_error' }, 'Unhandled API exception')
        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        )
      }
    })
  }
}

/**
 * RFC 9110 Retry-After, delta-seconds form. A timestamp is the other legal form but is
 * clock-skew sensitive and is what causes clients to hot-retry, so it is not used here.
 *
 * Only RateLimitError carries this: the value is a plain number written by RateLimiterService
 * onto `details.retryAfterSeconds`, and `retryAfterSeconds` is not one of errors.ts
 * UNSAFE_DETAIL_KEYS, so it survives sanitizeDetails() into the body as well as the header.
 */
function retryAfterHeader(error: AppError): Record<string, string> | undefined {
  if (!(error instanceof RateLimitError)) return undefined

  const details = error.details
  if (typeof details !== 'object' || details === null) return undefined

  const seconds = (details as { retryAfterSeconds?: unknown }).retryAfterSeconds
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return undefined

  return { 'Retry-After': String(Math.ceil(seconds)) }
}
