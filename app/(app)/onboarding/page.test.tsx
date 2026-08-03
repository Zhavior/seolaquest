import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`REDIRECT:${destination}`)
  }),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('server-only', () => ({}))

import OnboardingPage from './page'

describe('onboarding server boundary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns signed-out users through Clerk to the protected onboarding URL', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    await expect(OnboardingPage()).rejects.toThrow('REDIRECT:/sign-in?redirect_url=%2Fonboarding')
  })

  it('excludes completed users from onboarding', async () => {
    mocks.getCurrentUser.mockResolvedValue({ onboardingComplete: true })

    await expect(OnboardingPage()).rejects.toThrow('REDIRECT:/app')
  })

  it('passes persisted progress to the client for resume', async () => {
    mocks.getCurrentUser.mockResolvedValue({
      onboardingComplete: false,
      onboardingStep: 4,
      name: 'Boyd',
      profileIconKey: 'target',
      businessDescription: 'Websites',
      targetCustomer: 'Contractors',
      firstKeyword: 'need a website',
      preferredSource: 'REDDIT',
    })

    const element = await OnboardingPage()
    expect(element.props.initialDraft).toEqual({
      displayName: 'Boyd',
      profileIconKey: 'target',
      businessDescription: 'Websites',
      targetCustomer: 'Contractors',
      firstKeyword: 'need a website',
      preferredSource: 'REDDIT',
      onboardingStep: 4,
    })
  })
})
