import { createHmac } from 'node:crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '../infrastructure/logger'
import { RateLimitError } from '../infrastructure/errors'
import { machineSecretConfigured } from './machineBearer'

const LIMITER_CONFIG = {
  // Global API requests (per IP or userId) - relatively generous
  global: { limit: 100, window: '1 m', prefix: '@upstash/ratelimit/seolaquest/global' },
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
} as const

export type RateLimiterType = keyof typeof LIMITER_CONFIG

/**
 * Limiter types whose identifiers are user-attributable (userId, email, IP) and must
 * therefore never be persisted to Redis as literal keys. Mirrors AiUsageLimiter.tenantKey.
 */
const HASHED_TYPES: ReadonlySet<RateLimiterType> = new Set<RateLimiterType>(['auth', 'billing', 'xPost'])

export interface RateLimitOptions {
  type?: RateLimiterType
  identifier: string
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
 * Resolves the Redis key for a limiter. Returns null when a hashed type is requested but
 * no adequate signing secret is configured, so the caller can fail closed rather than
 * fall back to writing a raw identifier.
 */
export function limiterKey(
  type: RateLimiterType,
  identifier: string,
  secret: string | undefined,
): string | null {
  if (!HASHED_TYPES.has(type)) return identifier

  const configured = secret?.trim()
  if (!machineSecretConfigured(configured)) return null
  return createHmac('sha256', configured!).update(identifier, 'utf8').digest('hex')
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

    const key = limiterKey(type, options.identifier, process.env.RATE_LIMIT_KEY_SECRET)
    if (key === null) {
      return unavailable(
        type,
        isProduction,
        'ratelimit_key_secret_missing',
        'RATE_LIMIT_KEY_SECRET is missing or shorter than the required minimum',
      )
    }

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
      // The identifier is deliberately omitted: for hashed types it is a pseudonym, and for
      // `global` it is a raw IP or userId that does not belong in log storage.
      logger.warn(
        { event: 'rate_limit_exceeded', type, limit: result.limit, reset: result.reset },
        'Rate limit exceeded',
      )
      throw new RateLimitError('Rate limit exceeded. Please try again in a minute.')
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
    throw new RateLimitError('Rate limiting is temporarily unavailable. Please try again shortly.')
  }

  logger.warn(
    { event, type, outcomeCode: 'RATE_LIMITER_DEV_BYPASS' },
    `Rate limit bypassed outside production because ${detail}`,
  )
}
