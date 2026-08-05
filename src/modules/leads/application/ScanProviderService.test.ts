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

import {
  ENABLED_PROVIDERS,
  MAX_PROVIDER_CONCURRENCY,
  ScanProviderService,
} from './ScanProviderService'

function xBody(id = '1234567890') {
  return {
    data: [{
      id,
      text: 'Need a CRM',
      created_at: new Date().toISOString(),
      author_id: '42',
    }],
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
    mocks.leadFindMany.mockResolvedValue([{ id: 'lead-1', externalPostId: 'tw_1234567890' }])
    mocks.leadMatchCreateMany.mockResolvedValue({ count: 1 })
    mocks.attemptUpdate.mockResolvedValue({ id: 'attempt-1' })
  })

  it('scans X only and leaves the unreleased Reddit source untouched', async () => {
    vi.stubEnv('TWITTER_BEARER_TOKEN', 'configured-token')
    const fetchMock = vi.fn().mockImplementation(async () => (
      new Response(JSON.stringify({ data: [] }), { status: 200 })
    ))
    vi.stubGlobal('fetch', fetchMock)

    await expect(ScanProviderService.scanTenant('user-1', 'run-1')).resolves.toEqual({
      providerSucceeded: true,
      leadsCreated: 0,
    })
    expect(ENABLED_PROVIDERS).toEqual(['X'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    for (const [url] of fetchMock.mock.calls) {
      expect(url).toContain('api.twitter.com')
    }
    expect(mocks.attemptUpsert).toHaveBeenCalledTimes(2)
    expect(mocks.attemptUpsert).not.toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ provider: 'REDDIT' }),
    }))
    expect(mocks.attemptUpdate).toHaveBeenCalledTimes(2)
    expect(mocks.attemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ outcome: 'ZERO_RESULTS', resultCount: 0 }),
    }))
    expect(mocks.leadCreateMany).not.toHaveBeenCalled()
  })

  it('reports an unconfigured X provider without reaching the network', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(ScanProviderService.scanTenant('user-1', 'run-1')).resolves.toEqual({
      providerSucceeded: false,
      leadsCreated: 0,
      errorCode: 'ALL_SCAN_PROVIDERS_UNAVAILABLE',
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mocks.attemptUpdate).toHaveBeenCalledTimes(2)
    expect(mocks.attemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ outcome: 'PROVIDER_UNAVAILABLE', httpStatusClass: null }),
    }))
  })

  it('persists rate limits and malformed 2xx bodies as distinct stable outcomes', async () => {
    vi.stubEnv('TWITTER_BEARER_TOKEN', 'configured-token')
    mocks.keywordFindMany.mockResolvedValue([
      { id: 'kw-1', phrase: 'need a CRM' },
      { id: 'kw-2', phrase: 'sales pipeline' },
      { id: 'kw-3', phrase: 'crm recommendations' },
    ])
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [{ id: 'not-a-post-id', text: 'hi', created_at: new Date().toISOString() }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'retry-after': '60' } }))
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
    vi.stubEnv('TWITTER_BEARER_TOKEN', 'configured-token')
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => (
      new Response(JSON.stringify(xBody()), { status: 200 })
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
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      active += 1
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 2))
      active -= 1
      return new Response(JSON.stringify({ data: [] }), { status: 200 })
    }))

    await ScanProviderService.scanTenant('user-1', 'run-1')

    expect(peak).toBeLessThanOrEqual(MAX_PROVIDER_CONCURRENCY)
    expect(peak).toBeLessThan(20)
    expect(mocks.attemptUpsert).toHaveBeenCalledTimes(10)
  })
})
