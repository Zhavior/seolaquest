import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  leadFindMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: { lead: { findMany: mocks.leadFindMany } },
}))
// Rate limiting is covered by RateLimiter.test.ts; these cases exercise route behaviour.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

import { GET } from './route'

const request = () => new Request('https://seolaquest.test/api/dashboard/leads')
const context = { params: {} }

describe('dashboard leads route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.leadFindMany.mockResolvedValue([])
  })

  it('rejects unauthenticated callers before querying', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const response = await GET(request(), context)

    expect(response.status).toBe(401)
    expect(mocks.leadFindMany).not.toHaveBeenCalled()
  })

  it('only returns leads belonging to the current user', async () => {
    await GET(request(), context)

    expect(mocks.leadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    )
  })

  it('serialises the source timestamp and tolerates a null one', async () => {
    mocks.leadFindMany.mockResolvedValue([
      { id: 'a', sourceCreatedAt: new Date('2026-08-01T00:00:00.000Z') },
      { id: 'b', sourceCreatedAt: null },
    ])

    const body = await (await GET(request(), context)).json()

    expect(body.leads[0].sourceCreatedAt).toBe('2026-08-01T00:00:00.000Z')
    expect(body.leads[1].sourceCreatedAt).toBeNull()
  })

  it('returns a generic failure without the database detail', async () => {
    mocks.leadFindMany.mockRejectedValue(new Error('relation "leads" does not exist'))

    const response = await GET(request(), context)

    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('relation')
  })
})
