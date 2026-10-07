import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    geoQuery: { count: vi.fn(), create: vi.fn() },
  }
  return {
    tx,
    getCurrentUser: vi.fn(),
    runPerplexityAgent: vi.fn(),
    prisma: {
      $transaction: vi.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
      geoQuery: { update: vi.fn(), findMany: vi.fn() },
    },
  }
})

vi.mock('@/lib/prisma', () => ({ default: mocks.prisma }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/src/modules/core/infrastructure/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }))
vi.mock('../infrastructure/PerplexityAgentClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../infrastructure/PerplexityAgentClient')>()),
  runPerplexityAgent: mocks.runPerplexityAgent,
}))

import { GeoScanDisabledError, GeoScanService, MAX_GEO_SCANS_PER_DAY } from './GeoScanService'
import { PerplexityRequestError } from '../infrastructure/PerplexityAgentClient'
import { RateLimitError, UnauthorizedError, ValidationError } from '@/src/modules/core/infrastructure/errors'

const baseRow = {
  id: 'scan-1',
  userId: 'user-1',
  query: 'best seo tool',
  brandDomain: 'acme.com',
  engine: 'PERPLEXITY',
  engineModel: null,
  enginePreset: 'fast',
  providerResponseId: null,
  status: 'RUNNING',
  errorCode: null,
  answerText: null,
  sources: [],
  sourceCount: 0,
  citedCount: 0,
  brandCited: null,
  brandCitedRank: null,
  brandRetrieved: null,
  inputTokens: null,
  outputTokens: null,
  costUsd: null,
  costDetails: null,
  latencyMs: null,
  createdAt: new Date('2026-10-04T12:00:00.000Z'),
}

const engineResponse = {
  id: 'resp_1',
  model: 'perplexity/sonar',
  status: 'completed',
  output: [
    {
      type: 'search_results',
      results: [
        { id: 1, url: 'https://rival.com/', title: 'Rival', snippet: '' },
        { id: 2, url: 'https://acme.com/', title: 'Acme', snippet: '' },
      ],
    },
    { type: 'message', content: [{ type: 'output_text', text: 'Rival [1].', annotations: [] }] },
  ],
  usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15, cost: { currency: 'USD', input_cost: 0, output_cost: 0, total_cost: 0.0061 } },
}

describe('GeoScanService.runScan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GEO_SCAN_ENABLED', 'true')
    vi.stubEnv('PERPLEXITY_API_KEY', 'test-key')
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.tx.geoQuery.count.mockResolvedValue(0)
    mocks.tx.geoQuery.create.mockResolvedValue({ id: 'scan-1' })
    mocks.prisma.geoQuery.update.mockImplementation(async ({ data }) => ({ ...baseRow, ...data }))
  })
  afterEach(() => vi.unstubAllEnvs())

  const input = { query: '  best   seo tool ', brandDomain: 'https://www.acme.com/' }

  it('requires a signed-in user', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    await expect(GeoScanService.runScan(input)).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it.each([
    ['flag unset', undefined, 'test-key'],
    ['flag not exactly true', 'TRUE', 'test-key'],
    ['key missing', 'true', ''],
  ])('fails closed when %s, before any database write or engine call', async (_label, flag, key) => {
    vi.stubEnv('GEO_SCAN_ENABLED', flag as string)
    vi.stubEnv('PERPLEXITY_API_KEY', key)
    await expect(GeoScanService.runScan(input)).rejects.toBeInstanceOf(GeoScanDisabledError)
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
    expect(mocks.runPerplexityAgent).not.toHaveBeenCalled()
  })

  it('rejects a domain that does not parse', async () => {
    await expect(GeoScanService.runScan({ query: 'best seo tool', brandDomain: 'nope' })).rejects.toBeInstanceOf(ValidationError)
  })

  it('stops at the daily cap without calling the engine', async () => {
    mocks.tx.geoQuery.count.mockResolvedValue(MAX_GEO_SCANS_PER_DAY)
    await expect(GeoScanService.runScan(input)).rejects.toBeInstanceOf(RateLimitError)
    expect(mocks.tx.geoQuery.create).not.toHaveBeenCalled()
    expect(mocks.runPerplexityAgent).not.toHaveBeenCalled()
  })

  it('sends only the query, then records sources, brand presence and the engine-reported cost', async () => {
    mocks.runPerplexityAgent.mockResolvedValue(engineResponse)

    const scan = await GeoScanService.runScan(input)

    expect(mocks.runPerplexityAgent).toHaveBeenCalledWith('best seo tool', 'test-key')
    expect(mocks.tx.geoQuery.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ query: 'best seo tool', brandDomain: 'acme.com', status: 'RUNNING' }) }),
    )
    expect(scan).toMatchObject({
      status: 'COMPLETED',
      brandCited: false,
      brandRetrieved: true,
      sourceCount: 2,
      citedCount: 1,
      costUsd: '0.0061',
      inputTokens: 10,
      outputTokens: 5,
    })
    expect(scan.winningSources.map((s) => s.domain)).toEqual(['rival.com'])
  })

  it('keeps a failed engine call as a FAILED row so it still counts against the cap', async () => {
    mocks.runPerplexityAgent.mockRejectedValue(new PerplexityRequestError('HTTP_ERROR', 429))

    const scan = await GeoScanService.runScan(input)

    expect(scan).toMatchObject({ status: 'FAILED', errorCode: 'HTTP_ERROR_429', costUsd: null })
  })

  it('marks a response that does not match the documented schema as FAILED', async () => {
    mocks.runPerplexityAgent.mockResolvedValue({ output: 'not an array' })
    const scan = await GeoScanService.runScan(input)
    expect(scan).toMatchObject({ status: 'FAILED', errorCode: 'UNPARSEABLE_RESPONSE' })
  })
})
