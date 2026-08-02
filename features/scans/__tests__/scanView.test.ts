import { describe, expect, it } from 'vitest'
import {
  formatScanTime,
  normalizeScanStatus,
  toScanRunView,
  type SafeScanRunRecord,
} from '../scanView'

function record(overrides: Partial<SafeScanRunRecord> = {}): SafeScanRunRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    status: 'QUEUED',
    trigger: 'MANUAL',
    providerStatus: 'NOT_STARTED',
    counts: { leadsCreated: 0, providerAttempts: 0, providerResults: 0 },
    refunded: false,
    errorCode: null,
    balance: 12,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:05:00.000Z'),
    completedAt: null,
    ...overrides,
  }
}

describe('scan customer view', () => {
  it.each([
    ['QUEUED', 'QUEUED'],
    ['RUNNING', 'RUNNING'],
    ['SUCCEEDED', 'SUCCEEDED'],
    ['FAILED_REFUNDED', 'FAILED_REFUNDED'],
    ['DEAD', 'DEAD'],
    ['CANCELLED', 'CANCELLED'],
    ['PROVIDER_TOKEN_LEAK', 'UNKNOWN'],
    ['succeeded', 'UNKNOWN'],
    ['', 'UNKNOWN'],
  ])('maps backend status %s to %s', (backendStatus, visibleStatus) => {
    expect(normalizeScanStatus(backendStatus)).toBe(visibleStatus)
  })

  it('shows recorded refund truth without leaking raw error codes', () => {
    const view = toScanRunView(record({
      status: 'FAILED_REFUNDED',
      refunded: true,
      errorCode: 'RAW_PROVIDER_SECRET_AND_DATABASE_HOST',
    }))

    expect(view.refunded).toBe(true)
    expect(view.refundMessage).toContain('one scan credit was returned')
    expect(view.customerError).toContain('automatic attempts')
    expect(JSON.stringify(view)).not.toContain('RAW_PROVIDER_SECRET_AND_DATABASE_HOST')
  })

  it('uses cautious customer copy for dead, cancelled, and unknown runs', () => {
    for (const status of ['DEAD', 'CANCELLED', 'UNSUPPORTED_STATE']) {
      const view = toScanRunView(record({ status, errorCode: 'INTERNAL_FAILURE_DETAIL' }))
      expect(view.refunded).toBe(false)
      expect(view.refundMessage).toContain('No scan-credit refund is recorded')
      expect(view.customerError).not.toContain('INTERNAL_FAILURE_DETAIL')
    }
  })

  it('formats completed and updated timestamps in explicit UTC', () => {
    expect(formatScanTime(null)).toBe('Not yet')
    expect(formatScanTime('not-a-date')).toBe('Unavailable')
    expect(formatScanTime('2026-08-01T10:05:00.000Z')).toContain('UTC')
  })
})
