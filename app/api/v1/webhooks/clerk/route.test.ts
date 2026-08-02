import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  verifyWebhook: vi.fn(),
  accept: vi.fn(),
}))

vi.mock('@clerk/nextjs/webhooks', () => ({ verifyWebhook: mocks.verifyWebhook }))
vi.mock('@/src/modules/lifecycle/application/AccountDeletionService', () => ({
  AccountDeletionService: { acceptClerkUserDeleted: mocks.accept },
}))

import { POST } from './route'

function request(headers: Record<string, string> = { 'svix-id': 'msg_1' }) {
  return new NextRequest('http://localhost/api/v1/webhooks/clerk', {
    method: 'POST',
    headers,
    body: '{"type":"user.deleted","data":{"id":"user_1"}}',
  })
}

describe('Clerk lifecycle webhook route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'true')
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'whsec_test')
    vi.stubEnv('DELETION_AUDIT_SECRET', 'audit_test')
    mocks.verifyWebhook.mockResolvedValue({
      type: 'user.deleted',
      data: { id: 'user_1' },
    })
    mocks.accept.mockResolvedValue({ duplicate: false })
  })

  it('rejects a delivery without the required Svix event ID', async () => {
    const response = await POST(request({}))
    expect(response.status).toBe(400)
    expect(mocks.verifyWebhook).not.toHaveBeenCalled()
  })

  it('returns retryable unavailable while account deletion is not activated', async () => {
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'false')
    const response = await POST(request())

    expect(response.status).toBe(503)
    expect(mocks.verifyWebhook).not.toHaveBeenCalled()
  })

  it('passes the untouched Request to Clerk signature verification', async () => {
    const rawRequest = request()
    const response = await POST(rawRequest)

    expect(response.status).toBe(200)
    expect(mocks.verifyWebhook).toHaveBeenCalledWith(rawRequest)
    expect(mocks.accept).toHaveBeenCalledWith({
      eventId: 'msg_1',
      eventType: 'user.deleted',
      clerkUserId: 'user_1',
    })
  })

  it('rejects an invalid signature before persistence', async () => {
    mocks.verifyWebhook.mockRejectedValue(new Error('invalid signature'))
    const response = await POST(request())

    expect(response.status).toBe(400)
    expect(mocks.accept).not.toHaveBeenCalled()
  })

  it('acknowledges duplicate signed deliveries with 2xx', async () => {
    mocks.accept.mockResolvedValue({ duplicate: true })
    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('Event already accepted')
  })

  it('returns 5xx so Clerk retries a persistence failure', async () => {
    mocks.accept.mockRejectedValue(new Error('database unavailable'))
    const response = await POST(request())
    expect(response.status).toBe(500)
  })
})
