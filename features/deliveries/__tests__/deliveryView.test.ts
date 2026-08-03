import { describe, expect, it } from 'vitest'
import {
  formatAttempts,
  formatDeliveryTime,
  normalizeDeliveryStatus,
  toDeliveryView,
  type SafeDeliveryRecord,
} from '../deliveryView'

function record(overrides: Partial<SafeDeliveryRecord> = {}): SafeDeliveryRecord {
  return {
    id: 'delivery-1',
    leadId: 'lead-1',
    status: 'QUEUED',
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:05:00.000Z'),
    deliveredAt: null,
    durableJob: { status: 'PENDING', attempts: 2, maxAttempts: 5 },
    ...overrides,
  }
}

describe('delivery customer view', () => {
  it.each([
    ['QUEUED', 'QUEUED'],
    ['DELIVERED', 'DELIVERED'],
    ['DEAD', 'DEAD'],
    ['dead', 'UNKNOWN'],
    [' DELIVERED ', 'UNKNOWN'],
    ['RUNNING', 'UNKNOWN'],
    ['', 'UNKNOWN'],
  ])('maps backend status %s to %s', (backendStatus, visibleStatus) => {
    expect(normalizeDeliveryStatus(backendStatus)).toBe(visibleStatus)
  })

  it('allows retry only when both delivery and durable job are dead', () => {
    expect(toDeliveryView(record({ status: 'DEAD', durableJob: { status: 'DEAD', attempts: 5, maxAttempts: 5 } })).canRetry).toBe(true)
    expect(toDeliveryView(record({ status: 'DEAD', durableJob: { status: 'PENDING', attempts: 5, maxAttempts: 5 } })).canRetry).toBe(false)
    expect(toDeliveryView(record({ status: 'QUEUED', durableJob: { status: 'DEAD', attempts: 5, maxAttempts: 5 } })).canRetry).toBe(false)
    expect(toDeliveryView(record({ status: 'DEAD', durableJob: null })).canRetry).toBe(false)
  })

  it('uses customer-safe copy for failures and unknown states', () => {
    const dead = toDeliveryView(record({ status: 'DEAD', durableJob: { status: 'DEAD', attempts: 5, maxAttempts: 5 } }))
    const unknown = toDeliveryView(record({ status: 'INTERNAL_PROVIDER_FAILURE' }))

    expect(dead.statusMessage).toContain('automatic attempts')
    expect(unknown.status).toBe('UNKNOWN')
    expect(unknown.statusMessage).not.toContain('INTERNAL_PROVIDER_FAILURE')
  })

  it('formats attempts and timestamps without implying missing delivery', () => {
    expect(formatAttempts(2, 5)).toBe('2 of 5')
    expect(formatAttempts(0, 0)).toBe('0')
    expect(formatDeliveryTime(null)).toBe('Not yet')
    expect(formatDeliveryTime('not-a-date')).toBe('Unavailable')
    expect(formatDeliveryTime('2026-08-01T10:05:00.000Z')).toContain('UTC')
  })
})
