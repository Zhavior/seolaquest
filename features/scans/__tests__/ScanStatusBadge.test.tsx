import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScanRunDetail } from '../components/ScanRunDetail'
import { ScanStatusBadge } from '../components/ScanStatusBadge'
import { SCAN_STATUSES } from '../types'
import type { ScanRunView } from '../types'

describe('ScanStatusBadge', () => {
  it.each(SCAN_STATUSES)('explicitly renders %s', (status) => {
    render(<ScanStatusBadge status={status} />)
    expect(screen.getByText(status)).toBeInTheDocument()
  })

  it('labels stored lead counts as source matches in customer-facing detail', () => {
    const run: ScanRunView = {
      id: '11111111-1111-4111-8111-111111111111',
      status: 'SUCCEEDED',
      statusMessage: 'The scan finished.',
      trigger: 'MANUAL',
      providerHealth: 'AVAILABLE',
      providerSummary: 'Recorded provider attempts completed without an outage.',
      counts: { providerAttempts: 1, providerResults: 4, leadsCreated: 2 },
      refunded: false,
      refundMessage: 'No refund is recorded or expected.',
      customerError: null,
      currentBalance: 10,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:05:00.000Z',
      completedAt: '2026-08-01T10:04:00.000Z',
    }

    render(<ScanRunDetail run={run} />)
    expect(screen.getByText('Source matches')).toBeInTheDocument()
    expect(screen.queryByText('Stored leads')).not.toBeInTheDocument()
  })
})
