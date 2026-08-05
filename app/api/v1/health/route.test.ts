import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn(), loggerError: vi.fn() }))

vi.mock('@/lib/prisma', () => ({ default: { $queryRaw: mocks.queryRaw } }))
vi.mock('@/src/modules/core/infrastructure/logger', () => ({
  logger: { error: mocks.loggerError },
}))

import { GET } from './route'

describe('database health probe', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reports ok while the database answers', async () => {
    mocks.queryRaw.mockResolvedValue([{ '?column?': 1 }])

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      services: { database: 'connected' },
    })
  })

  it('reports 503 rather than ok when the database is unreachable', async () => {
    mocks.queryRaw.mockRejectedValue(new Error('connection refused at 10.0.0.4:5432'))

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      services: { database: 'disconnected' },
    })
  })

  it('does not leak the driver failure detail to the caller', async () => {
    mocks.queryRaw.mockRejectedValue(new Error('connection refused at 10.0.0.4:5432'))

    const response = await GET()

    expect(JSON.stringify(await response.json())).not.toContain('10.0.0.4')
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'health_probe_failed' }),
      'Health probe failed',
    )
  })
})
