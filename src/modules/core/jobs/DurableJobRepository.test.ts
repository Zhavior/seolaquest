import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), queryRaw: vi.fn() }))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: { $transaction: mocks.transaction, $queryRaw: mocks.queryRaw },
}))

import { DurableJobRepository, retryDelayMs } from './DurableJobRepository'

describe('DurableJobRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.queryRaw.mockResolvedValue([])
    mocks.transaction.mockImplementation(async (callback: (tx: { $queryRaw: typeof mocks.queryRaw }) => unknown) =>
      callback({ $queryRaw: mocks.queryRaw }),
    )
  })

  it('uses bounded exponential retry delays', () => {
    expect(retryDelayMs(1)).toBe(5_000)
    expect(retryDelayMs(2)).toBe(10_000)
    expect(retryDelayMs(20)).toBe(15 * 60_000)
  })

  it('claims with DB time, expired-lease recovery, tenant fairness, and skip locked', async () => {
    await DurableJobRepository.claimBatch({ workerId: 'worker-1', batchSize: 25, leaseMs: 60_000 })

    const [template, ...values] = mocks.queryRaw.mock.calls[0]
    const sql = Array.from(template as TemplateStringsArray).join('?')
    expect(sql).toContain('clock_timestamp()')
    expect(sql).toContain('WITH exhausted_candidates AS')
    expect(sql).toContain('ORDER BY exhausted_job."leaseExpiresAt", exhausted_job."createdAt", exhausted_job."id"')
    expect(sql).toContain('LIMIT ?\n        FOR UPDATE OF exhausted_job SKIP LOCKED')
    expect(sql).toContain('FROM exhausted_candidates')
    expect(sql).toContain('FOR UPDATE OF candidate SKIP LOCKED')
    expect(sql).toContain('earlier."userId" = candidate."userId"')
    expect(sql).toContain('candidate."leaseExpiresAt" <= clock_timestamp()')
    expect(sql).toContain('candidate."attempts" < candidate."maxAttempts"')
    expect(sql).toContain("'LEASE_EXPIRED_AT_MAX_ATTEMPTS'")
    expect(sql).toContain('UPDATE "CrmExportDelivery" AS delivery')
    expect(sql).toContain('"leaseGeneration" = job."leaseGeneration" + 1')
    expect(values.filter((value) => value === 25)).toHaveLength(2)
  })
})
