import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SettingsClient from '../components/SettingsClient'

vi.mock('@/features/profile/actions', () => ({
  updateSettingsAction: vi.fn().mockResolvedValue({ ok: true }),
  deleteAccountAction: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock('@clerk/nextjs', () => ({
  useReverification: () => vi.fn(),
}))

const initialSettings = {
  name: 'Hunter Santos',
  title: 'Knight Slasher',
  email: 'hunter@example.com',
  emailDigest: true,
  radarAlerts: false,
  crmWebhookUrl: 'https://hooks.zapier.com/test',
}

describe('SettingsClient Component', () => {
  it('renders settings fields with initial values', () => {
    render(<SettingsClient initial={initialSettings} />)

    expect(screen.getByDisplayValue('Hunter Santos')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Knight Slasher')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://hooks.zapier.com/test')).toBeInTheDocument()
    expect(screen.getByText('hunter@example.com')).toBeInTheDocument()
  })

  it('allows updating input values', () => {
    render(<SettingsClient initial={initialSettings} />)

    const nameInput = screen.getByDisplayValue('Hunter Santos')
    fireEvent.change(nameInput, { target: { value: 'Master Hunter' } })

    expect(screen.getByDisplayValue('Master Hunter')).toBeInTheDocument()
  })

  it('opens Guild Laws modal when clicking FAQ button', () => {
    render(<SettingsClient initial={initialSettings} />)

    const faqButton = screen.getByRole('button', { name: /Billing, cancellation & refund terms/i })
    fireEvent.click(faqButton)

    const lawHeaders = screen.getAllByText(/Guild Laws & Laws of Mana/i)
    expect(lawHeaders.length).toBeGreaterThanOrEqual(1)
  })
})
