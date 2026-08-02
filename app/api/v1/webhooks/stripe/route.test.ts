import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  process: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/src/modules/billing/application/WebhookService', () => ({
  WebhookService: { process: mocks.process },
}))
vi.mock('@/src/modules/core/infrastructure/logger', () => ({
  logger: { warn: mocks.warn, error: mocks.error },
}))

import { POST } from './route'

const secret = 'whsec_route_test'
const payload = JSON.stringify({
  id: 'evt_route_1',
  object: 'event',
  api_version: '2026-06-30.basil',
  created: 1785369600,
  data: { object: { id: 'obj_1' } },
  livemode: false,
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null },
  type: 'invoice.paid',
})

describe('Stripe webhook route signature boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_route')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', secret)
    mocks.process.mockResolvedValue({ recognized: true, duplicate: false })
  })

  it('rejects a request without a Stripe signature', async () => {
    const response = await POST(new Request('http://localhost/api/v1/webhooks/stripe', {
      method: 'POST',
      body: payload,
    }))
    expect(response.status).toBe(400)
    expect(mocks.process).not.toHaveBeenCalled()
  })

  it('rejects a signature that was not generated from the exact raw body', async () => {
    const signature = Stripe.webhooks.generateTestHeaderString({ payload: `${payload} `, secret })
    const response = await POST(new Request('http://localhost/api/v1/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    }))
    expect(response.status).toBe(400)
    expect(mocks.process).not.toHaveBeenCalled()
  })

  it('verifies the exact raw body before dispatching the event', async () => {
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret })
    const response = await POST(new Request('http://localhost/api/v1/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    }))
    expect(response.status).toBe(200)
    expect(mocks.process).toHaveBeenCalledOnce()
    expect(mocks.process.mock.calls[0][1]).toMatchObject({ id: 'evt_route_1', type: 'invoice.paid' })
  })

  it('returns retryable 503 while another non-expired worker owns the event lease', async () => {
    mocks.process.mockResolvedValue({ recognized: true, duplicate: false, inProgress: true })
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret })
    const response = await POST(new Request('http://localhost/api/v1/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    }))
    expect(response.status).toBe(503)
    expect(response.headers.get('retry-after')).toBe('30')
  })

  it('logs only a stable code and event type when processing fails', async () => {
    mocks.process.mockRejectedValue(new Error('raw Stripe identifier cus_sensitive'))
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret })
    const response = await POST(new Request('http://localhost/api/v1/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    }))

    expect(response.status).toBe(500)
    expect(mocks.error).toHaveBeenCalledWith({
      outcomeCode: 'STRIPE_WEBHOOK_PROCESSING_FAILED',
      eventType: 'invoice.paid',
    }, 'Stripe webhook processing failed')
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain('cus_sensitive')
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain('evt_route_1')
  })
})
