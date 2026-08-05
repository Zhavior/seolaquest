import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHmac } from 'node:crypto'

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  redisConstructor: vi.fn(),
  ratelimitConstructor: vi.fn(),
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
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
vi.mock('../infrastructure/logger', () => ({
  logger: { error: mocks.loggerError, warn: mocks.loggerWarn },
}))

const KEY_SECRET = 'limit-secret-0123456789abcdef01234567'

async function service() {
  const imported = await import('./RateLimiter')
  return imported.RateLimiterService
}

function configureUpstash() {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')
}

describe('RateLimiterService availability boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('fails closed in production when the limiter backend errors', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    configureUpstash()
    mocks.limit.mockRejectedValue(new Error('provider connection detail'))

    await expect((await service()).enforce({ type: 'global', identifier: '203.0.113.4' }))
      .rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', statusCode: 429 })

    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({ outcomeCode: 'RATE_LIMITER_FAILED_CLOSED' }),
      expect.stringContaining('failed closed in production'),
    )
  })

  it('fails closed in production when Upstash is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    await expect((await service()).enforce({ type: 'global', identifier: '203.0.113.4' }))
      .rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', statusCode: 429 })

    expect(mocks.limit).not.toHaveBeenCalled()
  })

  it('fails closed in production when a hashed type has no key secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    configureUpstash()

    await expect((await service()).enforce({ type: 'auth', identifier: 'user-1' }))
      .rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', statusCode: 429 })

    expect(mocks.limit).not.toHaveBeenCalled()
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'ratelimit_key_secret_missing' }),
      expect.any(String),
    )
  })

  it('bypasses outside production and labels the bypass distinctly', async () => {
    vi.stubEnv('NODE_ENV', 'development')

    await expect((await service()).enforce({ type: 'global', identifier: '203.0.113.4' }))
      .resolves.toBeUndefined()

    expect(mocks.limit).not.toHaveBeenCalled()
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ outcomeCode: 'RATE_LIMITER_DEV_BYPASS' }),
      expect.stringContaining('bypassed outside production'),
    )
    expect(mocks.loggerError).not.toHaveBeenCalled()
  })

  it('bypasses outside production when the backend errors rather than blocking the developer', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    configureUpstash()
    mocks.limit.mockRejectedValue(new Error('provider connection detail'))

    await expect((await service()).enforce({ type: 'global', identifier: '203.0.113.4' }))
      .resolves.toBeUndefined()

    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ outcomeCode: 'RATE_LIMITER_DEV_BYPASS' }),
      expect.any(String),
    )
  })

  it('still rejects a genuinely exceeded limit', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    configureUpstash()
    mocks.limit.mockResolvedValue({ success: false, limit: 100, remaining: 0, reset: Date.now() + 1_000 })

    await expect((await service()).enforce({ type: 'global', identifier: '203.0.113.4' }))
      .rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' })

    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'rate_limit_exceeded', type: 'global' }),
      'Rate limit exceeded',
    )
  })

  it('does not log the raw identifier when a limit is exceeded', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    configureUpstash()
    mocks.limit.mockResolvedValue({ success: false, limit: 100, remaining: 0, reset: Date.now() + 1_000 })

    await expect((await service()).enforce({ type: 'global', identifier: '203.0.113.4' })).rejects.toThrow()

    expect(mocks.loggerWarn).not.toHaveBeenCalledWith(
      expect.objectContaining({ identifier: '203.0.113.4' }),
      expect.any(String),
    )
  })

  it('allows a request under the limit', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    configureUpstash()
    mocks.limit.mockResolvedValue({ success: true, limit: 100, remaining: 99, reset: Date.now() + 1_000 })

    await expect((await service()).enforce({ type: 'global', identifier: '203.0.113.4' }))
      .resolves.toBeUndefined()
  })
})

describe('RateLimiterService key derivation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each(['auth', 'billing'] as const)('hashes the %s identifier with a stable HMAC', async (type) => {
    vi.stubEnv('NODE_ENV', 'production')
    configureUpstash()
    vi.stubEnv('RATE_LIMIT_KEY_SECRET', KEY_SECRET)
    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 1_000 })

    await (await service()).enforce({ type, identifier: 'user-1' })

    const expected = createHmac('sha256', KEY_SECRET).update('user-1', 'utf8').digest('hex')
    expect(mocks.limit).toHaveBeenCalledWith(expected)
    expect(mocks.limit).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/))
    expect(mocks.limit).not.toHaveBeenCalledWith('user-1')
  })

  it('leaves the global identifier unhashed and needs no key secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    configureUpstash()
    mocks.limit.mockResolvedValue({ success: true, limit: 100, remaining: 99, reset: Date.now() + 1_000 })

    await (await service()).enforce({ type: 'global', identifier: '203.0.113.4' })

    expect(mocks.limit).toHaveBeenCalledWith('203.0.113.4')
  })

  it('derives distinct keys for distinct identifiers', async () => {
    const { limiterKey } = await import('./RateLimiter')

    expect(limiterKey('auth', 'user-1', KEY_SECRET)).not.toEqual(limiterKey('auth', 'user-2', KEY_SECRET))
    expect(limiterKey('auth', 'user-1', KEY_SECRET)).toEqual(limiterKey('auth', 'user-1', KEY_SECRET))
  })

  it('returns null for a hashed type when the secret is too short to be adequate', async () => {
    const { limiterKey } = await import('./RateLimiter')

    expect(limiterKey('auth', 'user-1', 'too-short')).toBeNull()
    expect(limiterKey('auth', 'user-1', undefined)).toBeNull()
  })

  it('configures each limiter with its documented window', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    configureUpstash()
    vi.stubEnv('RATE_LIMIT_KEY_SECRET', KEY_SECRET)
    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 1_000 })

    await (await service()).enforce({ type: 'auth', identifier: 'user-1' })

    expect(mocks.ratelimitConstructor).toHaveBeenCalledWith(expect.objectContaining({
      limiter: { limit: 5, window: '1 m' },
      prefix: '@upstash/ratelimit/seolaquest/auth',
    }))
  })
})
