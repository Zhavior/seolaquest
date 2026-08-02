import { beforeEach, describe, expect, it, vi } from 'vitest'

const DELIVERY_ID = '11111111-1111-4111-8111-111111111111'
const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  entitlementsForUser: vi.fn(),
  getStatus: vi.fn(),
  retryDead: vi.fn(),
  normalize: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/src/modules/billing/application/EntitlementService', () => ({
  EntitlementService: { forUser: mocks.entitlementsForUser },
}))
vi.mock('@/src/modules/leads/application/CrmDeliveryService', () => ({
  CrmDeliveryService: { getStatus: mocks.getStatus, retryDead: mocks.retryDead },
}))
vi.mock('@/src/modules/core/security/crmWebhookUrl', () => ({
  normalizeCrmWebhookUrl: mocks.normalize,
  UnsafeCrmWebhookUrlError: class UnsafeCrmWebhookUrlError extends Error {},
}))

import { GET, POST } from './route'

function context(id = DELIVERY_ID) {
  return { params: Promise.resolve({ id }) }
}

describe('CRM delivery status and retry route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      crmWebhookUrl: 'https://hooks.example.com/crm',
    })
    mocks.entitlementsForUser.mockResolvedValue({ canExportToCRM: true })
    mocks.normalize.mockReturnValue('https://hooks.example.com/crm')
  })

  it('requires authentication before reading delivery state', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const response = await GET(new Request('https://app.example.com'), context())
    expect(response.status).toBe(401)
    expect(mocks.getStatus).not.toHaveBeenCalled()
  })

  it('reads only through the current tenant boundary', async () => {
    mocks.getStatus.mockResolvedValue({ id: DELIVERY_ID, status: 'QUEUED' })
    const response = await GET(new Request('https://app.example.com'), context())
    expect(response.status).toBe(200)
    expect(mocks.getStatus).toHaveBeenCalledWith({ userId: 'user-1', deliveryId: DELIVERY_ID })
  })

  it('requires current paid entitlement before retrying', async () => {
    mocks.entitlementsForUser.mockResolvedValue({ canExportToCRM: false })
    const response = await POST(new Request('https://app.example.com', { method: 'POST' }), context())
    expect(response.status).toBe(403)
    expect(mocks.retryDead).not.toHaveBeenCalled()
  })

  it('retries a dead delivery against the currently verified destination', async () => {
    mocks.retryDead.mockResolvedValue({ ok: true, deliveryId: DELIVERY_ID, status: 'QUEUED' })
    const response = await POST(new Request('https://app.example.com', { method: 'POST' }), context())
    expect(response.status).toBe(200)
    expect(mocks.retryDead).toHaveBeenCalledWith({
      userId: 'user-1',
      deliveryId: DELIVERY_ID,
      normalizedDestination: 'https://hooks.example.com/crm',
    })
  })
})
