import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ context: vi.fn(), created: [] as object[] }))
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: mocks.context }))
vi.mock('pg', () => ({ Pool: class {} }))
vi.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }))
vi.mock('@prisma/client', () => ({ PrismaClient: class {
  user = { findUnique: vi.fn(async () => this) }
  constructor() { mocks.created.push(this) }
  $transaction() { return this }
} }))

import prisma from './prisma'

describe('request-owned database clients', () => {
  it('reuses within a request, isolates concurrent requests, and binds transactions', async () => {
    const storage = new AsyncLocalStorage<object>()
    mocks.context.mockImplementation(() => ({ ctx: storage.getStore() }))
    const read = () => storage.run({}, async () => {
      const first = await prisma.user.findUnique({ where: { id: 'test' } })
      await Promise.resolve()
      const next = await prisma.user.findUnique({ where: { id: 'test' } })
      expect(next).toBe(first)
      expect(prisma.$transaction([])).toBe(first)
      return first
    })
    const [first, second] = await Promise.all([read(), read()])
    expect(first).not.toBe(second)
    expect(mocks.created).toHaveLength(2)
  })
})
