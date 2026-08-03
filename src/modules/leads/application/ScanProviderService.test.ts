import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  keywordFindMany: vi.fn(),
  attemptUpsert: vi.fn(),
  attemptUpdate: vi.fn(),
  leadCreateMany: vi.fn(),
  leadUpdateMany: vi.fn(),
  leadFindMany: vi.fn(),
  leadMatchCreateMany: vi.fn(),
  transaction: vi.fn(),
  loggerWarn: vi.fn(),
}))

const tx = {
  lead: {
    createMany: mocks.leadCreateMany,
    updateMany: mocks.leadUpdateMany,
    findMany: mocks.leadFindMany,
  },
  leadMatch: { createMany: mocks.leadMatchCreateMany },
  providerScanAttempt: { update: mocks.attemptUpdate },
}

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    trackedKeyword: { findMany: mocks.keywordFindMany },
    providerScanAttempt: { upsert: mocks.attemptUpsert },
    $transaction: mocks.transaction,
  },
}))
vi.mock('@/src/modules/core/infrastructure/logger', () => ({
  logger: { warn: mocks.loggerWarn },
}))

import { MAX_PROVIDER_CONCURRENCY, ScanProviderService } from './ScanProviderService'

function redditBody(name = 't3_abc') {
  return {
    data: { children: [{ data: {
      name,
      permalink: `/r/saas/comments/${name}`,
      title: 'Need a CRM',
      selftext: '',
      author: 'buyer',
      created_utc: Date.now() / 1_000,
    } }] },
  }
}

describe('ScanProviderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    mocks.keywordFindMany.mockResolvedValue([
      { id: 'kw-1', phrase: 'need a CRM' },
      { id: 'kw-2', phrase: 'sales pipeline' },
    ])
    let attempt = 0
    mocks.attemptUpsert.mockImplementation(async () => ({ id: `attempt-${++attempt}` }))
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx))
    mocks.leadCreateMany.mockResolvedValue({ count: 1 })
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 })
    mocks.leadFindMany.mockResolvedValue([{ id: 'lead-1', externalPostId: 't3_abc' }])
    mocks.leadMatchCreateMany.mockResolvedValue({ count: 1 })
    mocks.attemptUpdate.mockResolvedValue({ id: 'attempt-1' })
  })

  it('treats successful zero-result responses as success while exposing the unconfigured provider', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { children: [] },
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(ScanProviderService.scanTenant('user-1', 'run-1')).resolves.toEqual({
      providerSucceeded: true,
      leadsCreated: 0,
      errorCode: 'PARTIAL_PROVIDER_OUTAGE',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(mocks.attemptUpsert).toHaveBeenCalledTimes(4)
    expect(mocks.attemptUpdate).toHaveBeenCalledTimes(4)
    expect(mocks.attemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ outcome: 'ZERO_RESULTS', resultCount: 0 }),
    }))
    expect(mocks.attemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ outcome: 'PROVIDER_UNAVAILABLE', httpStatusClass: null }),
    }))
    expect(mocks.leadCreateMany).not.toHaveBeenCalled()
  })

  it('persists rate limits and malformed 2xx bodies as distinct stable outcomes', async () => {
    vi.stubEnv('TWITTER_BEARER_TOKEN', 'configured-token')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ wrong: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'retry-after': '60' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { children: [] } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(ScanProviderService.scanTenant('user-1', 'run-1')).resolves.toEqual({
      providerSucceeded: true,
      leadsCreated: 0,
      errorCode: 'PARTIAL_PROVIDER_OUTAGE',
    })
    expect(mocks.attemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ outcome: 'MALFORMED_RESPONSE', httpStatusClass: 2 }),
    }))
    expect(mocks.attemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        outcome: 'RATE_LIMITED',
        httpStatusClass: 4,
        rateLimitResetAt: expect.any(Date),
      }),
    }))
  })

  it('records multi-keyword provenance even when a matching lead already exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => (
      new Response(JSON.stringify(redditBody()), { status: 200 })
    )))
    mocks.leadCreateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })

    await ScanProviderService.scanTenant('user-1', 'run-1')

    expect(mocks.leadMatchCreateMany).toHaveBeenCalledTimes(2)
    expect(mocks.leadMatchCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        leadId: 'lead-1',
        scanRunId: 'run-1',
        keywordSnapshot: 'sales pipeline',
      })],
      skipDuplicates: true,
    })
    expect(mocks.attemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ resultCount: 1, insertedCount: 0 }),
    }))
  })

  it('caps provider work below twenty concurrent attempts', async () => {
    vi.stubEnv('TWITTER_BEARER_TOKEN', 'configured-token')
    mocks.keywordFindMany.mockResolvedValue(Array.from({ length: 10 }, (_, index) => ({
      id: `kw-${index}`,
      phrase: `keyword ${index}`,
    })))
    let active = 0
    let peak = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      active += 1
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 2))
      active -= 1
      return new Response(JSON.stringify(
        url.includes('reddit.com') ? { data: { children: [] } } : { data: [] },
      ), { status: 200 })
    }))

    await ScanProviderService.scanTenant('user-1', 'run-1')

    expect(peak).toBeLessThanOrEqual(MAX_PROVIDER_CONCURRENCY)
    expect(peak).toBeLessThan(20)
    expect(mocks.attemptUpsert).toHaveBeenCalledTimes(20)
  })
})
