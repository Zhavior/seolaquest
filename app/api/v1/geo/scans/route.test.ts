import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  runScan: vi.fn(),
  listRecent: vi.fn(),
}))

vi.mock('@/src/modules/geo/application/GeoScanService', () => ({
  GeoScanService: { runScan: mocks.runScan, listRecent: mocks.listRecent },
}))
// Rate limiting is covered by RateLimiter.test.ts; these cases exercise route behaviour.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

import { GET, POST } from './route'

const context = { params: {} }
const post = (body: unknown) =>
  new Request('https://seolaquest.test/api/v1/geo/scans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('geo scans route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists recent scans', async () => {
    mocks.listRecent.mockResolvedValue([{ id: 's1' }])
    const response = await GET(new Request('https://seolaquest.test/api/v1/geo/scans'), context)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, scans: [{ id: 's1' }] })
  })

  it('runs a scan and returns it', async () => {
    mocks.runScan.mockResolvedValue({ id: 's1', status: 'COMPLETED' })
    const response = await POST(post({ query: 'best seo tool', brandDomain: 'acme.com' }), context)
    expect(mocks.runScan).toHaveBeenCalledWith({ query: 'best seo tool', brandDomain: 'acme.com' })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, scan: { id: 's1', status: 'COMPLETED' } })
  })

  it('returns 502 with the recorded row when the engine call failed', async () => {
    mocks.runScan.mockResolvedValue({ id: 's1', status: 'FAILED', errorCode: 'TIMEOUT' })
    const response = await POST(post({ query: 'best seo tool', brandDomain: 'acme.com' }), context)
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toMatchObject({ success: false, scan: { errorCode: 'TIMEOUT' } })
  })

  it('rejects invalid input before reaching the service', async () => {
    const response = await POST(post({ query: 'x', brandDomain: 'acme.com' }), context)
    expect(response.status).toBe(400)
    expect(mocks.runScan).not.toHaveBeenCalled()
  })
})
