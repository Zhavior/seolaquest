import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))

import { GET } from './route'

describe('GET /api/v1/user/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without a current user', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(401)
  })

  it('returns a minimal allowlisted DTO and excludes sensitive database fields', async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'hunter@example.com',
      passwordHash: 'must-not-leak',
      name: 'Hunter',
      stripeCustomerId: 'cus_must_not_leak',
      crmWebhookUrl: 'https://hooks.example.com/private',
      questsRemaining: 42,
      maxCredits: 100,
      xp: 9000,
    })

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      user: {
        name: 'Hunter',
        questsRemaining: 42,
        maxCredits: 100,
      },
    })
  })
})
