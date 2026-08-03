import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getStatus: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/src/modules/leads/application/ScanRunService', () => ({
  ScanRunService: { getStatus: mocks.getStatus },
}))

import { GET } from './route'

const RUN_ID = '11111111-1111-4111-8111-111111111111'

function read(id = RUN_ID) {
  return GET(
    new Request(`http://localhost/api/v1/scans/${id}`),
    { params: Promise.resolve({ id }) },
  )
}

describe('GET /api/v1/scans/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.getStatus.mockResolvedValue({
      id: RUN_ID,
      status: 'SUCCEEDED',
      counts: { leadsCreated: 0, providerAttempts: 2, providerResults: 0 },
      completedAt: new Date('2026-08-01T12:00:00.000Z'),
      refunded: false,
      errorCode: 'PARTIAL_PROVIDER_OUTAGE',
      balance: 49,
      provider: { status: 'PARTIAL_OUTAGE', providers: [] },
    })
  })

  it('requires authentication before looking up a run', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const response = await read()
    expect(response.status).toBe(401)
    expect(mocks.getStatus).not.toHaveBeenCalled()
  })

  it('returns the allowlisted tenant status without raw provider failures', async () => {
    const response = await read()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      scan: expect.objectContaining({
        status: 'SUCCEEDED',
        refunded: false,
        errorCode: 'PARTIAL_PROVIDER_OUTAGE',
        balance: 49,
        provider: expect.objectContaining({ status: 'PARTIAL_OUTAGE' }),
      }),
    })
    expect(mocks.getStatus).toHaveBeenCalledWith('user-1', RUN_ID)
  })

  it('uses the same 404 for a missing or other-tenant run', async () => {
    mocks.getStatus.mockResolvedValue(null)
    const response = await read('22222222-2222-4222-8222-222222222222')
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Scan not found' })
  })

  it('rejects malformed IDs before touching tenant data', async () => {
    const response = await read('not-a-uuid')
    expect(response.status).toBe(400)
    expect(mocks.getStatus).not.toHaveBeenCalled()
  })

  it('does not expose internal database or provider errors', async () => {
    mocks.getStatus.mockRejectedValue(new Error('raw provider token and database details'))
    const response = await read()
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Scan status unavailable' })
  })
})
