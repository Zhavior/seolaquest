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
const jsonRequest = (method: string, body: unknown) =>
  new Request('https://seolaquest.test/api/v1/keywords', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

    const response = await DELETE(jsonRequest('DELETE', { id: 'k1' }), context)

    expect(response.status).toBe(200)
    expect(mocks.removeKeyword).toHaveBeenCalledWith('k1')
  })

  it('rejects a delete with no id', async () => {
    const response = await DELETE(jsonRequest('DELETE', { id: '' }), context)

    expect(response.status).toBe(400)
    expect(mocks.removeKeyword).not.toHaveBeenCalled()
  })
})
