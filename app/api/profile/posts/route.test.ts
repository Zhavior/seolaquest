import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  postFindMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: { post: { findMany: mocks.postFindMany } },
}))
// Rate limiting is covered by RateLimiter.test.ts; these cases exercise route behaviour.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

import { GET } from './route'

const request = () => new Request('https://seolaquest.test/api/profile/posts')
const context = { params: {} }

describe('profile posts route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.postFindMany.mockResolvedValue([])
  })

  it('rejects unauthenticated callers before querying', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const response = await GET(request(), context)

    expect(response.status).toBe(401)
    expect(mocks.postFindMany).not.toHaveBeenCalled()
  })

  it('only returns posts belonging to the current user', async () => {
    await GET(request(), context)

    expect(mocks.postFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    )
  })

  it('serialises created timestamps', async () => {
    mocks.postFindMany.mockResolvedValue([
      { id: 'p1', content: 'hello', createdAt: new Date('2026-08-01T00:00:00.000Z') },
    ])

    const body = await (await GET(request(), context)).json()

    expect(body.posts[0].createdAt).toBe('2026-08-01T00:00:00.000Z')
  })

  it('returns a generic failure without the database detail', async () => {
    mocks.postFindMany.mockRejectedValue(new Error('relation "posts" does not exist'))

    const response = await GET(request(), context)

    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('relation')
  })
})
