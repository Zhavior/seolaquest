import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ManaShopModal from './ManaShopModal'

const billingMocks = vi.hoisted(() => ({
  getBillingState: vi.fn(),
  createCheckout: vi.fn(),
}))

vi.mock('@/features/billing/actions', () => ({
  getBillingStateAction: billingMocks.getBillingState,
  createManaCheckoutAction: billingMocks.createCheckout,
}))

describe('ManaShopModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    billingMocks.getBillingState.mockResolvedValue({
      questsRemaining: 12,
      maxCredits: 50,
      potionCheckoutEnabled: false,
    })
  })

  it('exposes the verified shop status as an accessible dialog', async () => {
    render(<ManaShopModal onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'The Alchemist Shop' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close mana shop' })).toHaveFocus()

    await waitFor(() => {
      expect(dialog).toHaveAccessibleDescription(/top-ups are paused until refund and dispute reversals/i)
    })
    expect(screen.getByText(/never adds local credits/i)).toBeInTheDocument()
  })
})
