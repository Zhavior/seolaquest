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
    profileIconKey: 'target',
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
      reward: {
        xpAwarded: 50,
        xp: 50,
        level: 1,
        xpRequired: 100,
        didLevelUp: false,
        sampleQuestsSeeded: 3,
      },
    })
  })

  it('shows obvious account controls and saves before moving forward', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm initialDraft={draft()} />)

    expect(screen.getByRole('button', { name: /sign out/i })).toHaveClass('min-h-11')
    const firstHeading = screen.getByRole('heading', { name: /name your hunter/i })
    const displayNameInput = screen.getByRole('textbox', { name: /display name/i })
    expect(firstHeading).toHaveFocus()
    expect(displayNameInput).toHaveValue('Boyd')
    expect(displayNameInput).not.toHaveAttribute('autofocus')

    await user.click(screen.getByRole('button', { name: /continue/i }))
    const secondHeading = await screen.findByRole('heading', { name: /declare your trade/i })
    expect(secondHeading).toHaveFocus()
    expect(screen.getByRole('textbox', { name: /business or product/i })).not.toHaveAttribute('autofocus')
    expect(mocks.save).toHaveBeenCalledWith({ step: 1, value: { displayName: 'Boyd', profileIconKey: 'target' } })
  })

  it('offers skip only on optional context and supports back navigation', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm initialDraft={draft({ onboardingStep: 2 })} />)

    await user.click(screen.getByRole('button', { name: /skip for now/i }))
    expect(await screen.findByRole('heading', { name: /mark your quarry/i })).toBeVisible()
    expect(mocks.skip).toHaveBeenCalledWith(2)

    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('heading', { name: /declare your trade/i })).toBeVisible()
  })

  it('states the exact cost boundary and navigates with the returned database ID', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm initialDraft={draft({ onboardingStep: 6 })} />)

    expect(screen.getByText(/preview — saved setup, not live results/i)).toBeVisible()

    await user.click(screen.getByRole('button', { name: /complete setup/i }))
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        '/app?keywordId=kw%2Fid+stable&questComplete=first-quest&xp=50&samples=3',
      ),
    )
  })

  it('frames setup as a quest with the reward and objective progress visible', async () => {
    render(<OnboardingForm initialDraft={draft({ onboardingStep: 3 })} />)

    expect(screen.getByText(/reward \+50 xp/i)).toBeVisible()
    expect(screen.getByText(/objective 3 of 6/i)).toBeVisible()

    // Two of six objectives cleared before the current one.
    const log = screen.getByRole('region', { name: /quest objectives/i })
    expect(log).toHaveTextContent('33% cleared')
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent(/quarry/i)
  })

  it('equips a preset weapon into the keyword field', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm initialDraft={draft({ onboardingStep: 4, firstKeyword: '' })} />)

    await user.click(screen.getByRole('button', { name: /recommendation blade/i }))

    const keyword = screen.getByRole('textbox', { name: /equipped keyword/i })
    expect(keyword).toHaveValue('can anyone recommend')
    expect(screen.getByRole('button', { name: /recommendation blade/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('leaves an equipped preset fully editable', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm initialDraft={draft({ onboardingStep: 4, firstKeyword: '' })} />)

    await user.click(screen.getByRole('button', { name: /budget orb/i }))
    const keyword = screen.getByRole('textbox', { name: /equipped keyword/i })
    await user.clear(keyword)
    await user.type(keyword, 'need a piano teacher')

    expect(keyword).toHaveValue('need a piano teacher')
    // No longer matching the preset, so nothing claims to be equipped.
    expect(screen.getByRole('button', { name: /budget orb/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('celebrates the reward before leaving for the dashboard', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm initialDraft={draft({ onboardingStep: 6 })} />)

    await user.click(screen.getByRole('button', { name: /complete setup/i }))

    const celebration = await screen.findByRole('status')
    expect(celebration).toHaveTextContent(/quest complete/i)
    expect(celebration).toHaveTextContent(/\+50 xp/i)
  })

  it('offers a safe sign-in return link if the session expires', async () => {
    const user = userEvent.setup()
    mocks.save.mockResolvedValue({
      ok: false,
      code: 'SIGNED_OUT',
      message: 'Your session ended. Sign in again to resume your saved setup.',
    })
    render(<OnboardingForm initialDraft={draft()} />)

    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByRole('link', { name: /sign in to resume/i })).toHaveAttribute(
      'href',
      '/sign-in?redirect_url=%2Fonboarding',
    )
  })
})
