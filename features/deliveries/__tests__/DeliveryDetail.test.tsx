import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DeliveryView } from '../types'

vi.mock('../actions', () => ({
  retryDeliveryAction: vi.fn(),
}))

import { DeliveryDetail } from '../components/DeliveryDetail'

function delivery(overrides: Partial<DeliveryView> = {}): DeliveryView {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    leadId: 'lead-1',
    status: 'QUEUED',
    statusMessage: 'Waiting for the delivery worker or another automatic attempt.',
    attempts: 1,
    maxAttempts: 5,
    canRetry: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:05:00.000Z',
    deliveredAt: null,
    ...overrides,
  }
}

describe('DeliveryDetail retry controls', () => {
  it('does not render retry while a delivery is queued', () => {
    render(<DeliveryDetail delivery={delivery()} />)
    expect(screen.getByText('QUEUED')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /retry delivery/i })).not.toBeInTheDocument()
    expect(screen.getByText('Manual retry unavailable')).toBeInTheDocument()
  })

  it('renders retry only for a backend-retryable dead delivery', () => {
    render(<DeliveryDetail delivery={delivery({
      status: 'DEAD',
      statusMessage: 'Delivery stopped after its automatic attempts.',
      attempts: 5,
      canRetry: true,
    })} />)
    expect(screen.getByText('DEAD')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry delivery/i })).toBeInTheDocument()
  })
})
