import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  listKeywords: vi.fn(),
  addKeyword: vi.fn(),
  removeKeyword: vi.fn(),
}))

vi.mock('@/src/modules/keywords/application/KeywordService', () => ({
  KeywordService: {
    listKeywords: mocks.listKeywords,
    addKeyword: mocks.addKeyword,
    removeKeyword: mocks.removeKeyword,
  },
}))
// Rate limiting is covered by RateLimiter.test.ts; these cases exercise route behaviour.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

import { GET, POST, DELETE } from './route'

const context = { params: {} }
const KEYWORD_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
const jsonRequest = (method: string, body: unknown) =>
  new Request('https://seolaquest.test/api/v1/keywords', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
const rawRequest = (method: string, body: string) =>
  new Request('https://seolaquest.test/api/v1/keywords', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body,
  })

describe('keywords route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists keywords', async () => {
    mocks.listKeywords.mockResolvedValue([{ id: 'k1', phrase: 'seo audit', active: true }])

    const response = await GET(new Request('https://seolaquest.test/api/v1/keywords'), context)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      keywords: [{ id: 'k1', phrase: 'seo audit', active: true }],
    })
  })

  it('adds a valid keyword', async () => {
    mocks.addKeyword.mockResolvedValue({ id: 'k2', phrase: 'link building', active: true })

    const response = await POST(jsonRequest('POST', { phrase: 'link building' }), context)

    expect(response.status).toBe(200)
    expect(mocks.addKeyword).toHaveBeenCalledWith('link building')
  })

  it.each([
    ['too short', { phrase: 'ab' }],
    ['too long', { phrase: 'x'.repeat(81) }],
    ['missing', {}],
  ])('rejects a %s phrase without reaching the service', async (_label, body) => {
    const response = await POST(jsonRequest('POST', body), context)

    expect(response.status).toBe(400)
    expect(mocks.addKeyword).not.toHaveBeenCalled()
  })

  it('removes a keyword by id', async () => {
    mocks.removeKeyword.mockResolvedValue(undefined)

    const response = await DELETE(jsonRequest('DELETE', { id: KEYWORD_ID }), context)

    expect(response.status).toBe(200)
    expect(mocks.removeKeyword).toHaveBeenCalledWith(KEYWORD_ID)
  })

  it.each([
    ['empty', { id: '' }],
    ['not a uuid', { id: 'k1' }],
    ['oversized', { id: 'x'.repeat(5000) }],
    ['missing', {}],
  ])('rejects a %s delete id without opening a transaction', async (_label, body) => {
    const response = await DELETE(jsonRequest('DELETE', body), context)

    expect(response.status).toBe(400)
    expect(mocks.removeKeyword).not.toHaveBeenCalled()
  })

  it.each([
    ['malformed', '{"phrase":'],
    ['empty', ''],
  ])('answers 400 with a code for a %s POST body, never 500', async (_label, body) => {
    const response = await POST(rawRequest('POST', body), context)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(mocks.addKeyword).not.toHaveBeenCalled()
  })

  it('answers 400 with a code for a malformed DELETE body, never 500', async () => {
    const response = await DELETE(rawRequest('DELETE', 'not json at all'), context)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(mocks.removeKeyword).not.toHaveBeenCalled()
  })

  it('rejects an oversized body before parsing it', async () => {
    const response = await POST(rawRequest('POST', JSON.stringify({ phrase: 'a'.repeat(70_000) })), context)

    expect(response.status).toBe(400)
    expect(mocks.addKeyword).not.toHaveBeenCalled()
  })
})
