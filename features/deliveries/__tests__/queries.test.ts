import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/lib/prisma', () => ({
  default: {
    crmExportDelivery: {
      findMany: mocks.findMany,
      findFirst: mocks.findFirst,
    },
  },
}))

import { getCurrentUserDelivery, listCurrentUserDeliveries } from '../queries'

const DELIVERY_ID = '11111111-1111-4111-8111-111111111111'

function row() {
  return {
    id: DELIVERY_ID,
    leadId: 'lead-1',
    status: 'DEAD',
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:05:00.000Z'),
    deliveredAt: null,
    durableJob: { status: 'DEAD', attempts: 5, maxAttempts: 5 },
  }
}

describe('delivery queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'tenant-1' })
    mocks.findMany.mockResolvedValue([row()])
    mocks.findFirst.mockResolvedValue(row())
  })

  it('lists only the current tenant and selects only customer-safe fields', async () => {
    const result = await listCurrentUserDeliveries()

    expect(result.deliveries).toHaveLength(1)
    expect(result.deliveries[0]).toMatchObject({ status: 'DEAD', attempts: 5, canRetry: true })
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'tenant-1' },
      take: 101,
    }))

    const select = mocks.findMany.mock.calls[0][0].select
    expect(select).not.toHaveProperty('payload')
    expect(select).not.toHaveProperty('destinationFingerprint')
    expect(select).not.toHaveProperty('lastErrorCode')
    expect(select).not.toHaveProperty('responseStatus')
  })

  it('loads detail through both delivery ID and current tenant', async () => {
    await expect(getCurrentUserDelivery(DELIVERY_ID)).resolves.toMatchObject({ id: DELIVERY_ID })
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: DELIVERY_ID, userId: 'tenant-1' },
    }))
  })

  it('authenticates before rejecting an invalid delivery ID', async () => {
    await expect(getCurrentUserDelivery('not-a-uuid')).resolves.toBeNull()
    expect(mocks.requireCurrentUser).toHaveBeenCalledTimes(1)
    expect(mocks.findFirst).not.toHaveBeenCalled()
  })
})
