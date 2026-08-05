import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ snapshot: vi.fn() }))
const OPS_SECRET = 'ops-secret-0123456789abcdef0123456789'

vi.mock('@/src/modules/operations/application/OperationalHealthService', () => ({
  OperationalHealthService: { snapshot: mocks.snapshot },
}))

import { GET } from './route'

const request = (authorization?: string) =>
  new Request('https://app.example.com/api/v1/internal/dead-letters', {
    headers: authorization ? { authorization } : {},
  })

describe('dead-letter inspection route', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllEnvs())

  it('returns 503 when the machine secret is not configured', async () => {
    const response = await GET(request(`Bearer ${OPS_SECRET}`))

    expect(response.status).toBe(503)
    expect(mocks.snapshot).not.toHaveBeenCalled()
  })

  it('rejects a wrong bearer token without reading operational data', async () => {
    vi.stubEnv('OPS_SECRET', OPS_SECRET)

    const response = await GET(request('Bearer wrong'))

    expect(response.status).toBe(401)
    expect(mocks.snapshot).not.toHaveBeenCalled()
  })

  it('rejects a missing authorization header', async () => {
    vi.stubEnv('OPS_SECRET', OPS_SECRET)

    const response = await GET(request())

    expect(response.status).toBe(401)
    expect(mocks.snapshot).not.toHaveBeenCalled()
  })

  it('returns the snapshot counts for an authorized caller', async () => {
    vi.stubEnv('OPS_SECRET', OPS_SECRET)
    const checkedAt = new Date('2026-08-04T00:00:00.000Z').toISOString()
    mocks.snapshot.mockResolvedValue({ checkedAt, counts: { dead: 2 }, status: 'ok' })

    const response = await GET(request(`Bearer ${OPS_SECRET}`))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ checkedAt, counts: { dead: 2 } })
  })

  it('returns 503 instead of an error body when the snapshot fails', async () => {
    vi.stubEnv('OPS_SECRET', OPS_SECRET)
    mocks.snapshot.mockRejectedValue(new Error('internal queue detail'))

    const response = await GET(request(`Bearer ${OPS_SECRET}`))

    expect(response.status).toBe(503)
    expect(JSON.stringify(await response.json())).not.toContain('internal queue detail')
  })
})
