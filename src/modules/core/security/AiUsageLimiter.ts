import 'server-only'

import { createHmac } from 'node:crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { machineSecretConfigured } from './machineBearer'

const DAILY_AI_REPLY_LIMIT = 20

export type AiUsageLimitResult =
  | { allowed: true }
  | { allowed: false; reason: 'LIMITED' | 'UNAVAILABLE'; retryAt?: Date }

let limiter: Ratelimit | undefined

function getLimiter() {
  if (limiter) return limiter
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(DAILY_AI_REPLY_LIMIT, '1 d'),
    prefix: 'coquest:ai-reply:v1',
    analytics: true,
  })
  return limiter
}

function tenantKey(userId: string, secret: string) {
  return createHmac('sha256', secret).update(userId, 'utf8').digest('hex')
}

export class AiUsageLimiter {
  static async check(userId: string): Promise<AiUsageLimitResult> {
    const keySecret = process.env.RATE_LIMIT_KEY_SECRET?.trim()
    const configuredLimiter = getLimiter()
    if (!configuredLimiter || !machineSecretConfigured(keySecret)) {
      return { allowed: false, reason: 'UNAVAILABLE' }
    }

    try {
      const result = await configuredLimiter.limit(tenantKey(userId, keySecret!))
      if (result.success) return { allowed: true }
      return { allowed: false, reason: 'LIMITED', retryAt: new Date(result.reset) }
    } catch (error) {
      logger.error({ err: error, outcomeCode: 'AI_USAGE_LIMITER_UNAVAILABLE' }, 'AI usage limiter failed closed')
      return { allowed: false, reason: 'UNAVAILABLE' }
    }
  }
}
