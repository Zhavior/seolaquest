import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  enqueueManual: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/src/modules/leads/application/ScanRunService', () => ({
  ScanRunService: { enqueueManual: mocks.enqueueManual },
}))
// Rate limiting is covered by RateLimiter.test.ts; these cases exercise route behaviour.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

import { POST } from './route'

const request = () => new Request('http://localhost/api/v1/scan', { method: 'POST' })
const context = { params: {} }

describe('POST /api/v1/scan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.enqueueManual.mockResolvedValue({ queued: true, runId: 'run-1' })
  })

  it('rejects unauthenticated requests before accepting work', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const response = await POST(request(), context)
    expect(response.status).toBe(401)
    expect(mocks.enqueueManual).not.toHaveBeenCalled()
  })

  it('returns a truthful durable acceptance instead of cached or fake results', async () => {
    const response = await POST(request(), context)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      scanAccepted: true,
      queued: true,
      runId: 'run-1',
      message: 'Scan queued. Results will appear after processing.',
    })
    expect(mocks.enqueueManual).toHaveBeenCalledWith('user-1')
  })

  it.each([
    ['NO_ACTIVE_KEYWORDS', 422, 'Add a keyword before scanning.'],
    ['NOT_ENTITLED', 403, 'Manual scanning requires an active paid subscription.'],
    ['NO_CREDITS', 409, 'No scan credits remaining.'],
  ])('fails closed for %s', async (reason, status, error) => {
    mocks.enqueueManual.mockResolvedValue({ queued: false, reason })
    const response = await POST(request(), context)
    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ success: false, queued: false, error })
  })

  it('reports an already accepted run without creating another', async () => {
    mocks.enqueueManual.mockResolvedValue({ queued: false, existing: true, runId: 'run-existing' })
    const response = await POST(request(), context)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      scanAccepted: false,
      queued: true,
      runId: 'run-existing',
    })
  })
})
