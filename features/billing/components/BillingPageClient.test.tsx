import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { getBillingPlanCatalog } from '@/features/billing/catalog'
import type { BillingReadyViewModel } from '@/features/billing/viewModel'
import { BillingPageClient } from './BillingPageClient'

vi.mock('@/features/billing/actions', () => ({
  createBillingPortalAction: vi.fn(),
  createCheckoutAction: vi.fn(),
}))

function readyModel(): BillingReadyViewModel {
  return {
    status: 'free',
    checkedAt: '2026-08-01T12:00:00.000Z',
    currency: {
      code: 'USD',
      label: 'US dollars',
      checkoutDisclosure: 'Stripe shows the final total before confirmation.',
    },
    subscription: {
      plan: 'FREE',
      planName: 'Free Scout',
      providerStatus: 'inactive',
      statusLabel: 'Free account',
      paid: false,
      periodEnd: null,
      periodEndLabel: null,
      cancelAtPeriodEnd: false,
      renewalLabel: 'No paid renewal is scheduled.',
    },
    credits: {
      balance: 3,
      highestRecordedBalance: 5,
      estimatedScanCost: 1,
      estimatedBalanceAfterScan: 3,
      explanation: 'One credit is debited only when a new manual scan is durably queued.',
      refundExplanation: 'A terminal provider failure is refunded only when the ledger records it.',
    },
    scan: {
      eligible: false,
      label: 'Manual scan unavailable',
      reason: 'An active, webhook-confirmed paid subscription is required.',
      activeKeywordCount: 1,
    },
    availability: {
      payment: { state: 'unavailable', label: 'Payment unavailable', reason: 'Payment setup is not verified.' },
      checkout: { state: 'disabled', label: 'Checkout paused', reason: 'Checkout is default-off.' },
      worker: { state: 'disabled', label: 'Scan worker paused', reason: 'Worker is default-off.' },
      portal: { state: 'unavailable', label: 'Billing management unavailable', reason: 'No billing account is linked.' },
      creditTopUps: { state: 'disabled', label: 'Credit top-ups not for sale', reason: 'Refund reversals are not ready.' },
    },
    catalog: getBillingPlanCatalog(),
    checkoutReturn: {
      state: 'pending',
      title: 'Checkout returned — verification pending',
      message: 'Returning from Stripe is not proof of payment. Access remains unchanged until the signed webhook is processed.',
    },
    support: {
      email: 'support@coquest.ai',
      receiptCopy: 'Available receipts are in Stripe billing management.',
      refundCopy: 'Contact support for refund requests.',
    },
  }
}

describe('BillingPageClient truth rendering', () => {
  it('shows the neutral server loading state without a free plan or balance', () => {
    render(<BillingPageClient model={{
      status: 'loading',
      title: 'Checking your billing account…',
      message: 'No plan, balance, or paid access is shown until the server confirms it.',
    }} />)

    expect(screen.getByText('Checking your billing account…')).toBeInTheDocument()
    expect(screen.queryByText('Free account')).not.toBeInTheDocument()
    expect(screen.queryByText('Current scan credits')).not.toBeInTheDocument()
  })

  it('shows pending return, explicit scan cost, and disabled checkout without claiming success', () => {
    render(<BillingPageClient model={readyModel()} />)

    expect(screen.getByText('Checkout returned — verification pending')).toBeInTheDocument()
    expect(screen.getByText(/Returning from Stripe is not proof of payment/)).toBeInTheDocument()
    expect(screen.getByText('-1 credit')).toBeInTheDocument()
    expect(screen.getByText('Estimated balance after: 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Checkout paused' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Manage billing' })).toBeDisabled()
    expect(screen.queryByText('Payment successful')).not.toBeInTheDocument()

    const scanCostCard = screen.getByText('Estimated next manual scan').parentElement
    expect(scanCostCard).toHaveClass('w-full', 'min-w-0', 'lg:min-w-[260px]')
    expect(scanCostCard).not.toHaveClass('min-w-[260px]')
    expect(screen.getByRole('button', { name: 'Manage billing' })).toHaveClass('w-full', 'sm:w-auto')
  })
})
