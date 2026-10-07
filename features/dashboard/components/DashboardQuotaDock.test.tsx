import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardQuotaDock } from './DashboardQuotaDock'

describe('DashboardQuotaDock', () => {
  it('shows the real credits and plan label', () => {
    render(<DashboardQuotaDock remaining={4} max={10} plan="NO ACTIVE PLAN" canUsePaidScans={false} />)
    expect(screen.getByRole('region', { name: 'Credits and plan' })).toHaveTextContent('4 / 10 remaining')
    expect(screen.getByText('NO ACTIVE PLAN')).toBeInTheDocument()
  })

  it('points to plans only when paid scans are not available', () => {
    const { rerender } = render(<DashboardQuotaDock remaining={0} max={10} plan="NO ACTIVE PLAN" canUsePaidScans={false} />)
    expect(screen.getByRole('link', { name: 'See plans' })).toHaveAttribute('href', '/app/billing')
    rerender(<DashboardQuotaDock remaining={8} max={10} plan="BETA / active" canUsePaidScans />)
    expect(screen.getByRole('link', { name: 'Billing' })).toHaveAttribute('href', '/app/billing')
  })
})
