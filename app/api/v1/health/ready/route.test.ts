import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ snapshot: vi.fn() }))
const OPS_SECRET = 'ops-secret-0123456789abcdef0123456789'
vi.mock('@/src/modules/operations/application/OperationalHealthService', () => ({
  OperationalHealthService: { snapshot: mocks.snapshot },
}))

import { GET } from './route'

describe('readiness route', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('returns 503 when the machine secret is missing', async () => {
    const response = await GET(new Request('https://app.example.com/api/v1/health/ready'))
    expect(response.status).toBe(503)
    expect(mocks.snapshot).not.toHaveBeenCalled()
  })

  it('rejects the wrong bearer token', async () => {
    vi.stubEnv('OPS_SECRET', OPS_SECRET)
    const response = await GET(new Request('https://app.example.com/api/v1/health/ready', {
      headers: { authorization: 'Bearer wrong' },
    }))
    expect(response.status).toBe(401)
  })

  it('uses 503 for a truthful degraded snapshot', async () => {
    vi.stubEnv('OPS_SECRET', OPS_SECRET)
    mocks.snapshot.mockResolvedValue({ status: 'degraded', counts: {} })
    const response = await GET(new Request('https://app.example.com/api/v1/health/ready', {
      headers: { authorization: `Bearer ${OPS_SECRET}` },
    }))
    expect(response.status).toBe(503)
  })
})
