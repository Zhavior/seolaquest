import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
  request: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('node:dns/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:dns/promises')>()
  const defaultExport = (actual as unknown as { default?: Record<string, unknown> }).default ?? actual
  return {
    ...actual,
    default: { ...defaultExport, lookup: mocks.lookup },
    lookup: mocks.lookup,
  }
})
vi.mock('node:https', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:https')>()
  const defaultExport = (actual as unknown as { default?: Record<string, unknown> }).default ?? actual
  return {
    ...actual,
    default: { ...defaultExport, request: mocks.request },
    request: mocks.request,
  }
})

import { postCrmWebhook } from './crmWebhookRequest'

function successfulRequest(statusCode = 204) {
  mocks.request.mockImplementation((_url, _options, onResponse) => {
    const request = new EventEmitter() as EventEmitter & {
      end: ReturnType<typeof vi.fn>
      destroy: ReturnType<typeof vi.fn>
    }
    request.end = vi.fn()
    request.destroy = vi.fn()

    queueMicrotask(() => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode: number
        resume: ReturnType<typeof vi.fn>
      }
      response.statusCode = statusCode
      response.resume = vi.fn()
      onResponse(response)
      response.emit('end')
    })

    return request
  })
}

describe('postCrmWebhook DNS pinning', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pins the HTTPS socket lookup to the already-verified public address', async () => {
    mocks.lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    successfulRequest()

    await expect(postCrmWebhook('https://hooks.example.com/crm', { id: 'lead-1' })).resolves.toEqual({
      ok: true,
      status: 204,
    })

    const options = mocks.request.mock.calls[0][1]
    const callback = vi.fn()
    options.lookup('hooks.example.com', { family: 4 }, callback)
    expect(callback).toHaveBeenCalledWith(null, '93.184.216.34', 4)
    expect(mocks.request.mock.calls[0][0]).toEqual(new URL('https://hooks.example.com/crm'))
  })

  it('implements the Node 22 all-address lookup callback shape', async () => {
    const verified = [
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ]
    mocks.lookup.mockResolvedValue(verified)
    successfulRequest()

    await postCrmWebhook('https://hooks.example.com/crm', { id: 'lead-1' })

    const options = mocks.request.mock.calls[0][1]
    const callback = vi.fn()
    options.lookup('hooks.example.com', { all: true }, callback)
    expect(callback).toHaveBeenCalledWith(null, verified)
  })

  it('adds only the stable delivery headers requested by the durable dispatcher', async () => {
    mocks.lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    successfulRequest()

    await postCrmWebhook('https://hooks.example.com/crm', { id: 'lead-1' }, {
      idempotencyKey: 'coquest-crm-delivery-1',
      deliveryId: 'delivery-1',
    })

    expect(mocks.request.mock.calls[0][1].headers).toMatchObject({
      'Idempotency-Key': 'coquest-crm-delivery-1',
      'X-CoQuest-Delivery-Id': 'delivery-1',
    })
  })

  it('rejects a hostname resolving to a loopback address before opening a socket', async () => {
    mocks.lookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }])

    await expect(postCrmWebhook('https://hooks.example.com/crm', {})).rejects.toThrow(/non-public/)
    expect(mocks.request).not.toHaveBeenCalled()
  })

  it('rejects mixed public and private DNS answers to resist rebinding', async () => {
    mocks.lookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.8', family: 4 },
    ])

    await expect(postCrmWebhook('https://hooks.example.com/crm', {})).rejects.toThrow(/non-public/)
    expect(mocks.request).not.toHaveBeenCalled()
  })

  it('fails closed when DNS resolution fails', async () => {
    mocks.lookup.mockRejectedValue(new Error('DNS unavailable'))

    await expect(postCrmWebhook('https://hooks.example.com/crm', {})).rejects.toThrow(/resolved safely/)
    expect(mocks.request).not.toHaveBeenCalled()
  })
})
