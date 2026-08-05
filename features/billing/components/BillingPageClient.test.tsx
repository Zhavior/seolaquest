import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { getBillingPlanCatalog } from '@/features/billing/catalog'
import type { BillingReadyViewModel } from '@/features/billing/viewModel'
import { FOUNDER_LOCK_TERMS } from '@/src/modules/billing/domain/catalog'
import { BillingPageClient } from './BillingPageClient'

vi.mock('@/features/billing/actions', () => ({
  createBillingPortalAction: vi.fn(),
  createCheckoutAction: vi.fn(),
  createManaCheckoutAction: vi.fn(),
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
    founderPass: {
      limit: 50,
      claimed: 14,
      reserved: 2,
      remaining: 34,
      soldOut: false,
      sellable: true,
      priceConfigured: true,
      lockTerms: [...FOUNDER_LOCK_TERMS],
    },
    checkoutReturn: {
      state: 'pending',
      title: 'Checkout returned — verification pending',
      message: 'Returning from Stripe is not proof of payment. Access remains unchanged until the signed webhook is processed.',
    },
    support: {
      email: 'support@seolaquest.com',
      receiptCopy: 'Available receipts are in Stripe billing management.',
      refundCopy: 'Contact support for refund requests.',
    },
  }
}

// React 'use' polyfill for testing if needed, but we'll mock React.use or rely on standard React.use in tests since Next.js supports it
// Vitest with React 19 handles use() natively, but just in case we wrap it in Suspense
import { Suspense } from 'react'

describe('BillingPageClient rendering', () => {
  it('shows the neutral server loading state without a free plan or balance', async () => {
    const promise = Promise.resolve({
      status: 'loading' as const,
      title: 'Checking your billing account…',
      message: 'No plan, balance, or paid access is shown until the server confirms it.',
    })

    await act(async () => {
      render(
        <Suspense fallback={<div>Suspense Fallback</div>}>
          <BillingPageClient modelPromise={promise} />
        </Suspense>
      )
    })

    expect(await screen.findByText('Checking your billing account…')).toBeInTheDocument()
    expect(screen.queryByText('Free account')).not.toBeInTheDocument()
  })

  it('renders gamified UI with provided server model data', async () => {
    const promise = Promise.resolve(readyModel())

    await act(async () => {
      render(
        <Suspense fallback={<div>Suspense Fallback</div>}>
          <BillingPageClient modelPromise={promise} />
        </Suspense>
      )
    })

    // Await the Suspense boundary resolution
    expect(await screen.findByText('The Alchemist Shop')).toBeInTheDocument()
    
    // Check checkout notice renders
    expect(screen.getByText('Checkout returned — verification pending')).toBeInTheDocument()
    
    // Check balance renders in the RPG UI
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
