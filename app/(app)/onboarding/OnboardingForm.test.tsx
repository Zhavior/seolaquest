import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  save: vi.fn(),
  skip: vi.fn(),
  complete: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: mocks.refresh }),
}))
vi.mock('@clerk/nextjs', () => ({
  SignOutButton: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock('@/features/auth/actions', () => ({
  saveOnboardingStepAction: mocks.save,
  skipOnboardingStepAction: mocks.skip,
  completeOnboardingAction: mocks.complete,
}))

import OnboardingForm from './OnboardingForm'
import type { OnboardingDraft } from '@/features/auth/onboarding'

function draft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return {
    displayName: 'Boyd',
    businessDescription: 'Accessible websites',
    targetCustomer: 'Local service businesses',
    firstKeyword: 'need a website',
    preferredSource: 'REDDIT',
    onboardingStep: 1,
    ...overrides,
  }
}

describe('OnboardingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.save.mockResolvedValue({ ok: true, nextStep: 2 })
    mocks.skip.mockResolvedValue({ ok: true, nextStep: 3 })
    mocks.complete.mockResolvedValue({
      ok: true,
      keyword: { id: 'kw/id stable', phrase: 'need a website' },
    })
  })

  it('shows obvious account controls and saves before moving forward', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm initialDraft={draft()} />)

    expect(screen.getByRole('button', { name: /sign out/i })).toHaveClass('min-h-11')
    const firstHeading = screen.getByRole('heading', { name: /what should we call you/i })
    const displayNameInput = screen.getByRole('textbox', { name: /display name/i })
    expect(firstHeading).toHaveFocus()
    expect(displayNameInput).toHaveValue('Boyd')
    expect(displayNameInput).not.toHaveAttribute('autofocus')

    await user.click(screen.getByRole('button', { name: /save and continue/i }))
    const secondHeading = await screen.findByRole('heading', { name: /what do you sell or build/i })
    expect(secondHeading).toHaveFocus()
    expect(screen.getByRole('textbox', { name: /business or product description/i })).not.toHaveAttribute('autofocus')
    expect(mocks.save).toHaveBeenCalledWith({ step: 1, value: 'Boyd' })
  })

  it('offers skip only on optional context and supports back navigation', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm initialDraft={draft({ onboardingStep: 2 })} />)

    await user.click(screen.getByRole('button', { name: /skip for now/i }))
    expect(await screen.findByRole('heading', { name: /who is the target customer/i })).toBeVisible()
    expect(mocks.skip).toHaveBeenCalledWith(2)

    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('heading', { name: /what do you sell or build/i })).toBeVisible()
  })

  it('states the exact cost boundary and navigates with the returned database ID', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm initialDraft={draft({ onboardingStep: 6 })} />)

    expect(screen.getByText(/saving this setup costs 0 scan credits/i)).toBeVisible()
    expect(screen.getByText(/a manual scan costs 1 scan credit/i)).toBeVisible()
    expect(screen.getByText(/saved setup, not live results/i)).toBeVisible()

    await user.click(screen.getByRole('button', { name: /create keyword and open dashboard/i }))
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/app?keywordId=kw%2Fid%20stable'))
  })

  it('offers a safe sign-in return link if the session expires', async () => {
    const user = userEvent.setup()
    mocks.save.mockResolvedValue({
      ok: false,
      code: 'SIGNED_OUT',
      message: 'Your session ended. Sign in again to resume your saved setup.',
    })
    render(<OnboardingForm initialDraft={draft()} />)

    await user.click(screen.getByRole('button', { name: /save and continue/i }))
    expect(await screen.findByRole('link', { name: /sign in to resume/i })).toHaveAttribute(
      'href',
      '/sign-in?redirect_url=%2Fonboarding',
    )
  })
})
