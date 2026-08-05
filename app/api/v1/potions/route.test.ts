import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
// Rate limiting is covered by RateLimiter.test.ts; these cases exercise route behaviour.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

import { POST } from './route'

const request = () => new Request('https://seolaquest.test/api/v1/potions', { method: 'POST' })
const context = { params: {} }

describe('potions route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects unauthenticated callers', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const response = await POST(request(), context)

    expect(response.status).toBe(401)
  })

  it('refuses direct credit modification even for an authenticated user', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })

    const response = await POST(request(), context)

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Direct credit modification is disabled.',
    })
  })
})
