import { createHmac, randomBytes } from 'node:crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '../infrastructure/logger'
import { RateLimitError } from '../infrastructure/errors'
import { machineSecretConfigured } from './machineBearer'

const LIMITER_CONFIG = {
  // Global API requests (per IP or userId) - relatively generous
  global: { limit: 100, window: '1 m', prefix: '@upstash/ratelimit/seolaquest/global' },
  // Coarse pre-authentication tier, keyed by the resolved client IP. It runs BEFORE the
  // Clerk `auth()` round trip so a flood stops costing us an identity-provider call, which
  // is why it is deliberately looser than `global`: it is a flood brake, not the per-identity
  // allowance. 300/min sits above the 100/min per-identity budget so a small office or mobile
  // carrier NAT sharing one egress IP is not the first thing to break, while a single source
  // hammering the API is cut off inside a couple of seconds.
  ip: { limit: 300, window: '1 m', prefix: '@upstash/ratelimit/seolaquest/ip' },
  // Requests whose client IP could not be established (header absent, or the selected hop is
  // not a parseable address). Every such caller shares this ONE bucket, so it is sized as a
  // trickle rather than as a per-caller allowance: on Vercel the platform always appends the
  // peer address, so a request landing here is either a misconfigured deployment or someone
  // probing the parser. Tight enough to be useless as a bypass, non-zero so a genuine
  // infrastructure change degrades instead of hard-failing.
  unidentified: { limit: 10, window: '1 m', prefix: '@upstash/ratelimit/seolaquest/unidentified' },
  // Auth endpoints (login, signup, reset password) - strict
  auth: { limit: 5, window: '1 m', prefix: '@upstash/ratelimit/seolaquest/auth' },
  // Billing & sensitive write operations - moderate
  billing: { limit: 10, window: '1 m', prefix: '@upstash/ratelimit/seolaquest/billing' },
  // Writes to the single shared X account (app/api/x/post). Deliberately the strictest
  // tier in this file, and deliberately not `global` or `billing`: the budget being
  // protected is not ours to spend freely. X API v2 `POST /2/tweets` is capped per
  // access token per 24 h — 17 writes on the Free tier, 100 on Basic — and every
  // allowlisted admin draws down that ONE token, so a per-user allowance has to be
  // sized as a fraction of the account-wide cap rather than as a comfortable personal
  // quota. 8 per 24 h keeps two concurrent admins inside the Free-tier 17 and far
  // inside Basic's 100. X's own 429 (surfaced by the route) remains the backstop if
  // the allowlist ever grows past that.
  xPost: { limit: 8, window: '24 h', prefix: '@upstash/ratelimit/seolaquest/x-post' },
  // LLM endpoints that bill a real balance on OUR Gemini key (app/api/gemini/chat).
  // Identifier is a userId, and sign-up is public, so the per-account budget is the only
  // thing standing between an attacker with a free account and our invoice. Sizing: a chat
  // turn carries roughly 8k input + 1k output tokens, which on Gemini Flash pricing is on
  // the order of half a cent; 20/h therefore caps one account at ~$0.10/h, ~$2.40/day if it
  // never stops. That is small enough to absorb across a fleet of abusive signups and still
  // generous for a human — 20 turns an hour is a continuous conversation, not a UI accident.
  // A 1 h window (rather than a day) is chosen so a legitimate heavy user recovers the same
  // day instead of being locked out until tomorrow. This is a rate brake only; the per-tenant
  // SPEND cap remains AiUsageLimiter's job, and the two are meant to be used together.
  ai: { limit: 20, window: '1 h', prefix: '@upstash/ratelimit/seolaquest/ai' },
} as const

export type RateLimiterType = keyof typeof LIMITER_CONFIG

/**
 * Limiter types whose identifiers are user-attributable (userId, email, IP) and must
 * therefore never be persisted to Redis as literal keys. Mirrors AiUsageLimiter.tenantKey.
 *
 * `global` and `ip` are in this set even though they gate every route: they are handed a raw
 * Clerk userId or a raw client IP, and `analytics: true` records the key alongside request
 * counts, so leaving them literal would turn the limiter's own telemetry into a log of who
 * called what and from where. `unidentified` is deliberately absent — its identifier is a
 * fixed constant, so there is nothing to pseudonymize and hashing would only couple the
 * fallback bucket to the presence of a secret.
 */
const HASHED_TYPES: ReadonlySet<RateLimiterType> = new Set<RateLimiterType>([
  'global',
  'ip',
  'auth',
  'billing',
  'xPost',
  'ai',
])

/**
 * Hashed types that may fall back to a per-process ephemeral secret when
 * RATE_LIMIT_KEY_SECRET is unset, instead of failing closed.
 *
 * The tension: hashing needs a secret, and no secret means `limiterKey` cannot produce a
 * stable pseudonym. For a per-endpoint tier (auth/billing/xPost/ai) refusing the request is
 * right — those routes are individually sensitive and a handful of 429s is a cheap outage.
 * For `global`/`ip`, which wrap EVERY route, refusing would take the entire API offline the
 * moment an env var went missing. So instead of failing closed or writing raw identifiers,
 * these two derive their key from a random secret minted once per process:
 *
 *   - identifiers are still never persisted literally (privacy requirement holds);
 *   - limits are still ENFORCED, so this is not a fail-open (an attacker gains nothing per
 *     request, and the ephemeral secret is unguessable, so buckets cannot be targeted);
 *   - what degrades is only bucket CONTINUITY — each serverless instance and each cold start
 *     partitions its own buckets, so a caller spread across N instances gets up to N
 *     allowances. That is a weaker limit, not an absent one, and it is a deliberately smaller
 *     harm than a total API outage.
 *
 * The degradation is logged once per process per tier at error level so it is visible in
 * production rather than silent. Configure RATE_LIMIT_KEY_SECRET to get exact accounting.
 */
const EPHEMERAL_KEY_FALLBACK_TYPES: ReadonlySet<RateLimiterType> = new Set<RateLimiterType>([
  'global',
  'ip',
])

/**
 * Advertised back-off when the limiter itself is unavailable and production fails closed.
 * Short on purpose: the caller is not over budget, we simply cannot tell, so it should retry
 * soon rather than treat the outage as a long ban.
 */
const UNAVAILABLE_RETRY_AFTER_SECONDS = 5

/** RFC 9110 Retry-After is a delta in whole seconds; never let it round down to zero. */
const MAX_RETRY_AFTER_SECONDS = 24 * 60 * 60

export interface RateLimitOptions {
  type?: RateLimiterType
  identifier: string
}

/** Shape returned by {@link limiterKey}. A null `key` means the caller must fail closed. */
export interface LimiterKeyResolution {
  key: string | null
  /** True when the key came from the per-process ephemeral secret rather than the real one. */
  degraded: boolean
}

let ephemeralKeySecret: string | null = null

function getEphemeralKeySecret() {
  if (!ephemeralKeySecret) ephemeralKeySecret = randomBytes(32).toString('hex')
  return ephemeralKeySecret
}

/** Reset hook for tests; production code never calls this. */
export function __resetEphemeralKeySecret() {
  ephemeralKeySecret = null
}

export function retryAfterSecondsFrom(reset: number, now = Date.now()): number {
  if (!Number.isFinite(reset)) return UNAVAILABLE_RETRY_AFTER_SECONDS
  const seconds = Math.ceil((reset - now) / 1000)
  if (!Number.isFinite(seconds)) return UNAVAILABLE_RETRY_AFTER_SECONDS
  return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(1, seconds))
}

let cachedRedis: Redis | null = null
const cachedLimiters = new Map<RateLimiterType, Ratelimit>()

/**
 * Env is read lazily rather than at module scope so that a missing configuration is a
 * runtime decision (fail closed in production) instead of a boot-time fallback to a
 * mock Upstash endpoint that silently accepts every request.
 */
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null

  if (!cachedRedis) cachedRedis = new Redis({ url, token })
  return cachedRedis
}

function getLimiter(type: RateLimiterType) {
  const existing = cachedLimiters.get(type)
  if (existing) return existing

  const redis = getRedis()
  if (!redis) return null

  const config = LIMITER_CONFIG[type]
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    analytics: true,
    prefix: config.prefix,
  })
  cachedLimiters.set(type, limiter)
  return limiter
}

/**
 * Resolves the Redis key for a limiter.
 *
 * A raw identifier is only ever returned for types outside HASHED_TYPES. When a hashed type
 * has no adequate signing secret the result is either a `degraded` key derived from the
 * per-process ephemeral secret (for the API-wide tiers listed in
 * EPHEMERAL_KEY_FALLBACK_TYPES) or `{ key: null }`, which tells the caller to fail closed.
 * There is no path here that writes a user-attributable value literally.
 */
export function limiterKey(
  type: RateLimiterType,
  identifier: string,
  secret: string | undefined,
): LimiterKeyResolution {
  if (!HASHED_TYPES.has(type)) return { key: identifier, degraded: false }

  const configured = secret?.trim()
  if (machineSecretConfigured(configured)) {
    return { key: hash(configured!, identifier), degraded: false }
  }

  if (EPHEMERAL_KEY_FALLBACK_TYPES.has(type)) {
    return { key: hash(getEphemeralKeySecret(), identifier), degraded: true }
  }

  return { key: null, degraded: false }
}

function hash(secret: string, identifier: string) {
  return createHmac('sha256', secret).update(identifier, 'utf8').digest('hex')
}

/** One error line per process per tier, so the degradation is loud but not per-request spam. */
const reportedDegradedTypes = new Set<RateLimiterType>()

function reportDegradedKey(type: RateLimiterType) {
  if (reportedDegradedTypes.has(type)) return
  reportedDegradedTypes.add(type)
  logger.error(
    { event: 'ratelimit_key_secret_missing', type, outcomeCode: 'RATE_LIMITER_DEGRADED_KEY' },
    'RATE_LIMIT_KEY_SECRET is missing: limiting continues against a per-process ephemeral key, '
      + 'so buckets do not survive a cold start and are not shared across instances',
  )
}

export class RateLimiterService {
  /**
   * Check if a request exceeds rate limits. Throws RateLimitError if exceeded, and — in
   * production — also throws when the limiter itself cannot be consulted. A limiter that
   * cannot answer must not be read as "allowed".
   */
  static async enforce(options: RateLimitOptions): Promise<void> {
    const type = options.type || 'global'
    const isProduction = process.env.NODE_ENV === 'production'

    const limiter = getLimiter(type)
    if (!limiter) {
      return unavailable(type, isProduction, 'ratelimit_unconfigured', 'Upstash is not configured')
    }

    const { key, degraded } = limiterKey(type, options.identifier, process.env.RATE_LIMIT_KEY_SECRET)
    if (key === null) {
      return unavailable(
        type,
        isProduction,
        'ratelimit_key_secret_missing',
        'RATE_LIMIT_KEY_SECRET is missing or shorter than the required minimum',
      )
    }
    if (degraded) reportDegradedKey(type)

    let result: Awaited<ReturnType<Ratelimit['limit']>>
    try {
      result = await limiter.limit(key)
    } catch (error) {
      logger.error(
        { err: error, event: 'ratelimit_service_failure', type, outcomeCode: 'RATE_LIMITER_UNAVAILABLE' },
        'Rate limit service call failed',
      )
      return unavailable(type, isProduction, 'ratelimit_service_failure', 'the limiter backend errored')
    }

    if (!result.success) {
      // The identifier is deliberately omitted: it is either a pseudonym or a raw IP/userId,
      // and neither belongs in log storage.
      const retryAfterSeconds = retryAfterSecondsFrom(result.reset)
      logger.warn(
        { event: 'rate_limit_exceeded', type, limit: result.limit, reset: result.reset, retryAfterSeconds },
        'Rate limit exceeded',
      )
      // `retryAfterSeconds` rides in `details` so withApiHandler can render it as an RFC 9110
      // Retry-After header. It is a plain finite number under a key that is not in
      // errors.ts UNSAFE_DETAIL_KEYS, so sanitizeDetails() passes it through untouched.
      throw new RateLimitError('Rate limit exceeded. Please retry after the indicated delay.', {
        retryAfterSeconds,
      })
    }
  }
}

/**
 * Production fails closed; non-production stays permissive but says so explicitly, so the
 * two outcomes are never confused when reading logs.
 */
function unavailable(
  type: RateLimiterType,
  isProduction: boolean,
  event: string,
  detail: string,
): void {
  if (isProduction) {
    logger.error(
      { event, type, outcomeCode: 'RATE_LIMITER_FAILED_CLOSED' },
      `Rate limiter failed closed in production because ${detail}`,
    )
    throw new RateLimitError('Rate limiting is temporarily unavailable. Please try again shortly.', {
      retryAfterSeconds: UNAVAILABLE_RETRY_AFTER_SECONDS,
    })
  }

  logger.warn(
    { event, type, outcomeCode: 'RATE_LIMITER_DEV_BYPASS' },
    `Rate limit bypassed outside production because ${detail}`,
  )
}
