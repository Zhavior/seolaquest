import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
// Rate limiting is covered by RateLimiter.test.ts; these cases exercise route behaviour.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

import { GET } from './route'

const request = () => new Request('https://seolaquest.test/api/v1/mlb/live')
const context = { params: {} }

describe('mlb live route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects unauthenticated callers', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const response = await GET(request(), context)

    expect(response.status).toBe(401)
  })

  it('returns an empty dataset for an authenticated user', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })

    const response = await GET(request(), context)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok', data: [] })
  })
})
