import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LowManaToast from '../LowManaToast'

describe('LowManaToast Component', () => {
  it('renders critical mana warning when credits are low (<= 15%)', () => {
    render(<LowManaToast remainingCredits={10} totalCredits={100} />)

    expect(screen.getByText(/CRITICAL MANA/i)).toBeInTheDocument()
    expect(screen.getByText(/Need More Potions!/i)).toBeInTheDocument()
    expect(screen.getByText(/10 quests/i)).toBeInTheDocument()
  })

  it('does not render when credits are above 15%', () => {
    render(<LowManaToast remainingCredits={50} totalCredits={100} />)

    expect(screen.queryByText(/CRITICAL MANA/i)).toBeNull()
  })

  it('calls onOpenShop when Refill button is clicked', () => {
    const handleOpenShop = vi.fn()
    render(<LowManaToast remainingCredits={10} totalCredits={100} onOpenShop={handleOpenShop} />)

    const refillBtn = screen.getByRole('button', { name: /Refill/i })
    expect(refillBtn).toHaveClass('min-h-11')
    fireEvent.click(refillBtn)

    expect(handleOpenShop).toHaveBeenCalledTimes(1)
  })

  it('dismisses toast when X button is clicked', async () => {
    render(<LowManaToast remainingCredits={10} totalCredits={100} />)

    const dismissBtn = screen.getByRole('button', { name: /dismiss low mana warning/i })
    expect(dismissBtn).toHaveClass('h-11', 'w-11')
    fireEvent.click(dismissBtn)

    await waitFor(() => expect(screen.queryByText(/critical mana/i)).not.toBeInTheDocument())
  })

  it('does not render an inert refill action when no shop handler exists', () => {
    render(<LowManaToast remainingCredits={10} totalCredits={100} />)

    expect(screen.queryByRole('button', { name: /refill/i })).not.toBeInTheDocument()
  })
})
