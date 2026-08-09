import { beforeEach, describe, expect, it, vi } from 'vitest'
import { INITIAL_RETRY_DELIVERY_STATE } from '../types'

const mocks = vi.hoisted(() => {
  class UnsafeCrmWebhookUrlError extends Error {}
  return {
    UnsafeCrmWebhookUrlError,
    requireCurrentUser: vi.fn(),
    entitlementsForUser: vi.fn(),
    normalize: vi.fn(),
    retryDead: vi.fn(),
    revalidatePath: vi.fn(),
    logError: vi.fn(),
    logWarn: vi.fn(),
  }
})

vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/src/modules/billing/application/EntitlementService', () => ({
  EntitlementService: { forUser: mocks.entitlementsForUser },
}))
vi.mock('@/src/modules/core/security/crmWebhookUrl', () => ({
  normalizeCrmWebhookUrl: mocks.normalize,
  UnsafeCrmWebhookUrlError: mocks.UnsafeCrmWebhookUrlError,
}))
vi.mock('@/src/modules/leads/application/CrmDeliveryService', () => ({
  CrmDeliveryService: { retryDead: mocks.retryDead },
}))
// `withServerAction` runs the action inside `loggerContext`, so the mock has to provide the
// real AsyncLocalStorage as well as the logger methods the wrapper itself calls.
vi.mock('@/src/modules/core/infrastructure/logger', async () => {
  const { AsyncLocalStorage } = await import('node:async_hooks')
  return {
    logger: { error: mocks.logError, warn: mocks.logWarn },
    loggerContext: new AsyncLocalStorage(),
  }
})
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import { retryDeliveryAction } from '../actions'

const DELIVERY_ID = '11111111-1111-4111-8111-111111111111'

function submit(id = DELIVERY_ID) {
  return retryDeliveryAction(id, INITIAL_RETRY_DELIVERY_STATE, new FormData())
}

describe('retryDeliveryAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({
      id: 'tenant-1',
      crmWebhookUrl: 'https://hooks.example.com/crm',
    })
    mocks.entitlementsForUser.mockResolvedValue({ canExportToCRM: true })
    mocks.normalize.mockReturnValue('https://hooks.example.com/crm')
    mocks.retryDead.mockResolvedValue({ ok: true, deliveryId: DELIVERY_ID, status: 'QUEUED' })
  })

  it('re-authenticates and retries through the tenant-scoped backend contract', async () => {
    await expect(submit()).resolves.toEqual({
      outcome: 'success',
      message: 'Retry queued. The delivery worker will try again.',
    })
    expect(mocks.requireCurrentUser).toHaveBeenCalledTimes(1)
    expect(mocks.retryDead).toHaveBeenCalledWith({
      userId: 'tenant-1',
      deliveryId: DELIVERY_ID,
      normalizedDestination: 'https://hooks.example.com/crm',
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/app/deliveries/${DELIVERY_ID}`)
  })

  it('stops before the retry service when current access does not allow export', async () => {
    mocks.entitlementsForUser.mockResolvedValue({ canExportToCRM: false })
    await expect(submit()).resolves.toMatchObject({ outcome: 'error', message: expect.stringContaining('paid plan') })
    expect(mocks.retryDead).not.toHaveBeenCalled()
  })

  it('returns a customer-safe message when the session has expired', async () => {
    mocks.requireCurrentUser.mockRejectedValue(new Error('Unauthorized'))

    await expect(submit()).resolves.toEqual({
      outcome: 'error',
      message: 'Your session has expired. Sign in again before retrying.',
    })
    expect(mocks.retryDead).not.toHaveBeenCalled()
  })

  it('stops before the retry service when the CRM connection is missing or unsafe', async () => {
    mocks.normalize.mockImplementation(() => {
      throw new mocks.UnsafeCrmWebhookUrlError('private destination details')
    })
    const result = await submit()

    expect(result).toEqual({ outcome: 'error', message: 'Update your CRM connection in Settings before retrying.' })
    expect(result.message).not.toContain('private destination details')
    expect(mocks.retryDead).not.toHaveBeenCalled()
  })

  it('keeps backend refusal and unexpected exceptions customer-safe', async () => {
    mocks.retryDead.mockResolvedValueOnce({ ok: false, reason: 'DESTINATION_CHANGED' })
    await expect(submit()).resolves.toEqual({
      outcome: 'error',
      message: 'This delivery is no longer eligible for retry. Refresh the page for its latest status.',
    })

    mocks.retryDead.mockRejectedValueOnce(new Error('raw webhook exception with destination'))
    const unexpected = await submit()
    expect(unexpected).toEqual({
      outcome: 'error',
      message: 'Retry is temporarily unavailable. Please try again later.',
    })
    expect(unexpected.message).not.toContain('webhook')
  })
})
