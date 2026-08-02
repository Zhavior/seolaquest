import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: {
    lead: { findMany: mocks.findMany },
  },
}))

import { POST } from './route'

describe('POST /api/v1/scan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', questsRemaining: 7 })
  })

  it('does not query leads for an unauthenticated request', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const response = await POST()

    expect(response.status).toBe(401)
    expect(mocks.findMany).not.toHaveBeenCalled()
  })

  it('returns an empty tenant-scoped result without deducting credit', async () => {
    mocks.findMany.mockResolvedValue([])

    const response = await POST()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      scanAccepted: false,
      resultSource: 'cached',
      questsFound: [],
      creditsDeducted: 0,
      questsRemaining: 7,
    })
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  })

  it('returns only stored lead facts and does not charge for a cached read', async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: 'lead-1',
        platform: 'REDDIT',
        author: 'u/builder',
        content: 'Looking for a CRM',
        sourceCreatedAt: new Date('2026-07-29T12:00:00.000Z'),
        url: 'https://www.reddit.com/r/SaaS/comments/lead-1',
      },
    ])

    const response = await POST()
    const body = await response.json()

    expect(body).toMatchObject({
      scanAccepted: false,
      resultSource: 'cached',
      creditsDeducted: 0,
      questsRemaining: 7,
    })
    expect(body.questsFound).toEqual([
      {
        id: 'lead-1',
        platform: 'REDDIT',
        source: 'REDDIT',
        author: 'u/builder',
        content: 'Looking for a CRM',
        sourceCreatedAt: '2026-07-29T12:00:00.000Z',
        url: 'https://www.reddit.com/r/SaaS/comments/lead-1',
      },
    ])
    expect(body.questsFound[0]).not.toHaveProperty('intentScore')
    expect(body.questsFound[0]).not.toHaveProperty('xpReward')
    expect(body.questsFound[0]).not.toHaveProperty('estimatedValue')
  })
})
