import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn() }))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({ default: { $queryRaw: mocks.queryRaw } }))

import { assertDatabaseSessionUtc, isDatabaseSessionUtc } from './databaseClock'

describe('assertDatabaseSessionUtc', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(['UTC', 'Etc/UTC', 'GMT'])('accepts %s', async (timeZone) => {
    expect(isDatabaseSessionUtc(timeZone)).toBe(true)
    mocks.queryRaw.mockResolvedValue([{ timeZone }])
    await expect(assertDatabaseSessionUtc()).resolves.toBe(timeZone)
  })

  it.each(['America/Halifax', 'US/Pacific', ''])('fails closed for %s', async (timeZone) => {
    mocks.queryRaw.mockResolvedValue([{ timeZone }])
    await expect(assertDatabaseSessionUtc()).rejects.toThrow('must be UTC')
  })
})
