import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  isPaidCheckoutOpen: vi.fn(() => false),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/features/billing/checkoutGate', () => ({ isPaidCheckoutOpen: mocks.isPaidCheckoutOpen }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))

import WelcomePage from './page'

describe('early-access welcome page', () => {
  beforeEach(() => {
    mocks.isPaidCheckoutOpen.mockReturnValue(false)
  })

  it('says GEO scans are not on yet and offers the X tool without pushing it', async () => {
    mocks.getCurrentUser.mockResolvedValue({ onboardingComplete: false, onboardingStep: 1 })
    render(await WelcomePage())

    expect(screen.getByRole('heading', { level: 1, name: "You're on the early-access list" })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Citation scans are not switched on yet' })).toBeVisible()
    expect(screen.getByText(/There is no date yet/)).toBeVisible()
    expect(screen.getByRole('link', { name: /See what a scan will show/ })).toHaveAttribute('href', '/radar')
    expect(screen.getByRole('link', { name: 'Set up the X lead finder' })).toHaveAttribute('href', '/onboarding')
    expect(screen.getByText(/paid plans are not on sale yet/)).toBeVisible()
  })

  it('offers to continue a started setup, and follows the real checkout switch', async () => {
    mocks.getCurrentUser.mockResolvedValue({ onboardingComplete: false, onboardingStep: 3 })
    mocks.isPaidCheckoutOpen.mockReturnValue(true)
    render(await WelcomePage())

    expect(screen.getByRole('link', { name: 'Continue setting up the X lead finder' })).toBeVisible()
    expect(screen.queryByText(/not on sale yet/)).toBeNull()
    expect(screen.getByRole('link', { name: 'pricing' })).toHaveAttribute('href', '/pricing')
  })

  it('sends finished accounts to the app and signed-out visitors to sign in', async () => {
    mocks.getCurrentUser.mockResolvedValue({ onboardingComplete: true, onboardingStep: 6 })
    await expect(WelcomePage()).rejects.toThrow('redirect:/app')

    mocks.getCurrentUser.mockResolvedValue(null)
    await expect(WelcomePage()).rejects.toThrow('redirect:/sign-in?redirect_url=%2Fwelcome')
  })
})
