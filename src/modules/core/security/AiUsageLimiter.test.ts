import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  redisConstructor: vi.fn(),
  ratelimitConstructor: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@upstash/redis', () => ({
  Redis: class Redis {
    constructor(input: unknown) {
      mocks.redisConstructor(input)
    }
  },
}))
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class Ratelimit {
    static slidingWindow(limit: number, window: string) {
      return { limit, window }
    }

    constructor(input: unknown) {
      mocks.ratelimitConstructor(input)
    }

    limit(identifier: string) {
      return mocks.limit(identifier)
    }
  },
}))
vi.mock('@/src/modules/core/infrastructure/logger', () => ({
  logger: { error: mocks.loggerError },
}))

async function service() {
  const imported = await import('./AiUsageLimiter')
  return imported.AiUsageLimiter
}

describe('AiUsageLimiter economic boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('fails closed when distributed limiter configuration is incomplete', async () => {
    await expect((await service()).check('user-1')).resolves.toEqual({
      allowed: false,
      reason: 'UNAVAILABLE',
    })
    expect(mocks.limit).not.toHaveBeenCalled()
  })

  it('uses an HMAC tenant key and enforces the daily window', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')
    vi.stubEnv('RATE_LIMIT_KEY_SECRET', 'limit-secret-0123456789abcdef01234567')
    mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 1_000 })

    await expect((await service()).check('user-1')).resolves.toEqual({ allowed: true })
    expect(mocks.ratelimitConstructor).toHaveBeenCalledWith(expect.objectContaining({
      limiter: { limit: 20, window: '1 d' },
      prefix: 'coquest:ai-reply:v1',
    }))
    expect(mocks.limit).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/))
    expect(mocks.limit).not.toHaveBeenCalledWith('user-1')
  })

  it('fails closed and records only a stable outcome when Redis errors', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')
    vi.stubEnv('RATE_LIMIT_KEY_SECRET', 'limit-secret-0123456789abcdef01234567')
    mocks.limit.mockRejectedValue(new Error('provider connection detail'))

    await expect((await service()).check('user-1')).resolves.toEqual({
      allowed: false,
      reason: 'UNAVAILABLE',
    })
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({ outcomeCode: 'AI_USAGE_LIMITER_UNAVAILABLE' }),
      'AI usage limiter failed closed',
    )
  })
})
