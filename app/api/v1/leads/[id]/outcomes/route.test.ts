import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ user: vi.fn(), record: vi.fn(), history: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.user }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/src/modules/core/security/RateLimiter', () => ({ RateLimiterService: { enforce: vi.fn() } }))
vi.mock('@/src/modules/leads/application/LeadOutcomeService', () => ({ LeadOutcomeService: { record: mocks.record, history: mocks.history } }))
import { GET, POST } from './route'
const leadId = '4d456acd-d1cb-4c36-a42c-8101a4a92a11'
const context = { params: Promise.resolve({ id: leadId }) }
const request = (body: string, key?: string) => new Request('https://example.test/api/v1/leads/' + leadId + '/outcomes', {
  method: 'POST', body, headers: key ? { 'Idempotency-Key': key } : {},
})
describe('lead outcome API', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: 'owner' }) })
  it('requires authentication before reading outcomes', async () => {
    mocks.user.mockResolvedValue(null)
    expect((await GET(new Request('https://example.test'), context)).status).toBe(401)
    expect(mocks.history).not.toHaveBeenCalled()
  })
  it.each([['{"action":"CLAIM"}', undefined], ['{', 'request_1'],
    ['{"action":"CONVERT","evidenceKind":"VERIFIED"}', 'request_1']])('rejects missing receipts, malformed JSON, and forged evidence', async (body, key) => {
    expect((await POST(request(body!, key), context)).status).toBe(400)
    expect(mocks.record).not.toHaveBeenCalled()
  })
  it('binds the actor to the session and exposes only the outcome receipt', async () => {
    mocks.record.mockResolvedValue({ outcome: { id: 'receipt', action: 'CONVERT', resultingStatus: 'CONVERTED',
      evidenceKind: 'CUSTOMER_REPORTED', requestFingerprint: 'private', actorId: 'owner' }, replayed: false })
    const response = await POST(request('{"action":"CONVERT"}', 'request_1'), context)
    expect(response.status).toBe(200)
    expect(mocks.record).toHaveBeenCalledWith({ userId: 'owner', leadId, idempotencyKey: 'request_1', input: { action: 'CONVERT' } })
    expect(JSON.stringify(await response.json())).not.toContain('requestFingerprint')
  })
})
