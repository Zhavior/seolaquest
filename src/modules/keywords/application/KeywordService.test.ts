import { Prisma } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  scheduleUpsert: vi.fn(),
  scheduleUpdateMany: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: {
    trackedKeyword: {
      findMany: mocks.findMany,
    },
    $transaction: mocks.transaction,
  },
}))

import { KeywordService } from './KeywordService'

const tx = {
  $queryRaw: mocks.queryRaw,
  trackedKeyword: {
    create: mocks.create,
    deleteMany: mocks.deleteMany,
    count: mocks.count,
  },
  tenantScanSchedule: {
    upsert: mocks.scheduleUpsert,
    updateMany: mocks.scheduleUpdateMany,
  },
}

describe('KeywordService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx))
    mocks.scheduleUpsert.mockResolvedValue({ userId: 'user-1' })
    mocks.scheduleUpdateMany.mockResolvedValue({ count: 1 })
    mocks.queryRaw.mockResolvedValue([{ id: 'user-1' }])
    mocks.count.mockResolvedValue(0)
  })

  it('owns the authenticated keyword read and returns a minimal DTO', async () => {
    mocks.findMany.mockResolvedValue([
      { id: 'kw-1', phrase: 'need a designer', active: true, _count: { leads: 3 } },
    ])

    await expect(KeywordService.listKeywords()).resolves.toEqual([
      {
        id: 'kw-1',
        phrase: 'need a designer',
        active: true,
        heroClass: 'Keyword monitor',
        platform: 'Reddit',
        status: 'Active',
        matchesFound: 3,
      },
    ])
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }))
  })

  it('only claims Twitter coverage when the integration is configured', async () => {
    vi.stubEnv('TWITTER_BEARER_TOKEN', 'configured-for-test')
    mocks.findMany.mockResolvedValue([
      { id: 'kw-1', phrase: 'need a designer', active: true, _count: { leads: 0 } },
    ])

    const [keyword] = await KeywordService.listKeywords()
    expect(keyword.platform).toBe('Reddit & Twitter')
  })

  it('returns an unauthorized operational error before querying Prisma', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    await expect(KeywordService.listKeywords()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    })
    expect(mocks.findMany).not.toHaveBeenCalled()
  })

  it('maps only Prisma unique violations to the duplicate-keyword message', async () => {
    mocks.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '5.10.2',
      }),
    )

    await expect(KeywordService.addKeyword('need a designer')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'That keyword is already being tracked.',
    })
  })

  it('does not mislabel unknown database failures as duplicates', async () => {
    const outage = new Error('database unavailable')
    mocks.create.mockRejectedValue(outage)

    await expect(KeywordService.addKeyword('need a designer')).rejects.toBe(outage)
  })

  it('creates a disabled schedule until the tenant explicitly opts in', async () => {
    mocks.create.mockResolvedValue({
      id: 'kw-1', phrase: 'need a designer', active: true, _count: { leads: 0 },
    })

    await KeywordService.addKeyword('need a designer')

    const [template] = mocks.queryRaw.mock.calls[0]
    const lockSql = Array.from(template as TemplateStringsArray).join('?')
    expect(lockSql).toContain('FROM "User"')
    expect(lockSql).toContain('FOR UPDATE')
    expect(mocks.queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.scheduleUpsert.mock.invocationCallOrder[0],
    )
    expect(mocks.scheduleUpsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', enabled: false },
      update: { enabled: false },
    })
  })

  it('serializes and enforces the active keyword provider budget', async () => {
    mocks.count.mockResolvedValue(10)

    await expect(KeywordService.addKeyword('one too many')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'You can track up to 10 active keywords.',
    })
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.scheduleUpsert).not.toHaveBeenCalled()
  })

  it('disables the durable schedule when the last active keyword is removed', async () => {
    mocks.deleteMany.mockResolvedValue({ count: 1 })
    mocks.count.mockResolvedValue(0)

    await expect(KeywordService.removeKeyword('kw-1')).resolves.toEqual({ ok: true, alreadyAbsent: false })
    expect(mocks.scheduleUpdateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', enabled: true },
      data: { enabled: false },
    })
  })

  it('treats repeated deletion as an idempotent success', async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 })

    await expect(KeywordService.removeKeyword('kw-1')).resolves.toEqual({ ok: true, alreadyAbsent: true })
    expect(mocks.scheduleUpdateMany).not.toHaveBeenCalled()
  })
})
