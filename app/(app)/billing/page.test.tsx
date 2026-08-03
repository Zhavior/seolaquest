import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  buildBillingViewModel: vi.fn(),
  recordBillingEvent: vi.fn(),
}))

vi.mock('@/features/billing/viewModel', () => ({
  buildBillingViewModel: mocks.buildBillingViewModel,
}))
vi.mock('@/features/billing/analytics', () => ({
  BILLING_EVENTS: {
    billingViewed: 'billing_account_viewed',
    checkoutReturnPending: 'billing_checkout_return_pending',
    checkoutReturnCancelled: 'billing_checkout_return_cancelled',
    activationVerified: 'billing_activation_verified',
  },
  recordBillingEvent: mocks.recordBillingEvent,
}))
vi.mock('@/features/billing/components/BillingPageClient', () => {
  const { useState, useEffect } = require('react')
  return {
    BillingPageClient: ({ modelPromise }: { modelPromise: Promise<any> }) => {
      const [model, setModel] = useState<any>(null)
      useEffect(() => {
        modelPromise.then(setModel)
      }, [modelPromise])
      if (!model) return <div data-testid="billing-client">loading</div>
      return <div data-testid="billing-client">{model.status}:{model.checkoutReturn?.state ?? 'none'}</div>
    },
  }
})

import BillingPage from './page'

describe('Billing page server boundary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes checkout return parameters to the server-owned view model', async () => {
    mocks.buildBillingViewModel.mockResolvedValue({
      status: 'free',
      checkoutReturn: { state: 'pending' },
      subscription: { plan: 'FREE' },
    })

    render(await BillingPage({
      searchParams: Promise.resolve({
        checkout: 'verifying',
        session_id: 'cs_test_1',
      }),
    }))

    expect(mocks.buildBillingViewModel).toHaveBeenCalledWith({
      checkout: 'verifying',
      sessionId: 'cs_test_1',
    })
    expect(await screen.findByText('free:pending')).toBeInTheDocument()
    expect(mocks.recordBillingEvent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'billing_checkout_return_pending',
      outcome: 'pending',
    }))
  })

  it('renders unavailable truth without activation instrumentation', async () => {
    mocks.buildBillingViewModel.mockResolvedValue({ status: 'unavailable' })

    render(await BillingPage({ searchParams: Promise.resolve({}) }))

    expect(await screen.findByText('unavailable:none')).toBeInTheDocument()
    expect(mocks.recordBillingEvent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'billing_account_viewed',
      accountState: 'unavailable',
    }))
    expect(mocks.recordBillingEvent).not.toHaveBeenCalledWith(expect.objectContaining({
      name: 'billing_activation_verified',
    }))
  })
})
