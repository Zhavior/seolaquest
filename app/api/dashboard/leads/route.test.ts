import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  leadFindMany: vi.fn(),
  // fetchDashboardLeads joins Aurora's verdict onto each lead, so the feed can
  // say "not scored" instead of inventing a number.
  auroraDecisionFindMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/src/modules/leads/application/LeadQueryService', () => ({ LeadQueryService: { openQueue: mocks.leadFindMany } }))
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
    mocks.auroraDecisionFindMany.mockResolvedValue([])
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
      'user-1',
    )
  })

  it('serialises the source timestamp and tolerates a null one', async () => {
    mocks.leadFindMany.mockResolvedValue([
      { id: 'a', sourceCreatedAt: '2026-08-01T00:00:00.000Z' },
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
