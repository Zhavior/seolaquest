import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  keywordFindMany: vi.fn(),
  leadFindMany: vi.fn(),
  subscriptionFindUnique: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: {
    trackedKeyword: { findMany: mocks.keywordFindMany },
    lead: { findMany: mocks.leadFindMany },
    billingSubscription: { findUnique: mocks.subscriptionFindUnique },
  },
}))
// Rate limiting is covered by RateLimiter.test.ts; these cases exercise route behaviour.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

import { GET } from './route'

const request = () => new Request('https://seolaquest.test/api/dashboard')
const context = { params: {} }

describe('dashboard hydration route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'hunter@example.com',
      name: 'Hunter',
      title: 'Lead Hunter',
      xp: 10,
      level: 2,
      xpRequired: 100,
      questsRemaining: 5,
      maxCredits: 20,
    })
    mocks.keywordFindMany.mockResolvedValue([])
    mocks.leadFindMany.mockResolvedValue([])
    mocks.subscriptionFindUnique.mockResolvedValue(null)
  })

  it('rejects unauthenticated callers before querying', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const response = await GET(request(), context)

    expect(response.status).toBe(401)
    expect(mocks.leadFindMany).not.toHaveBeenCalled()
  })

  it('scopes every query to the current user', async () => {
    await GET(request(), context)

    expect(mocks.keywordFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    )
    expect(mocks.leadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    )
    expect(mocks.subscriptionFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    )
  })

  it('serialises lead dates and reports no active plan when unsubscribed', async () => {
    mocks.leadFindMany.mockResolvedValue([
      {
        id: 'lead-1',
        platform: 'REDDIT',
        author: 'someone',
        content: 'needs seo help',
        matched: 'seo',
        url: 'https://example.com/1',
        sourceCreatedAt: new Date('2026-08-01T00:00:00.000Z'),
      },
    ])

    const response = await GET(request(), context)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.leads[0].sourceCreatedAt).toBe('2026-08-01T00:00:00.000Z')
    expect(body.user.planLabel).toBe('NO ACTIVE PLAN')
  })

  it('labels the active plan when a subscription exists', async () => {
    mocks.subscriptionFindUnique.mockResolvedValue({ plan: 'PRO', status: 'active' })

    const body = await (await GET(request(), context)).json()

    expect(body.user.planLabel).toBe('PRO / active')
  })

  it('returns a generic failure without the database detail', async () => {
    mocks.leadFindMany.mockRejectedValue(new Error('relation "leads" does not exist'))

    const response = await GET(request(), context)

    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('relation')
  })
})
