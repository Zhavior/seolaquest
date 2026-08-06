import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ signIn: vi.fn() }))

vi.mock('@clerk/nextjs', () => ({
  SignIn: (props: unknown) => {
    mocks.signIn(props)
    return <div data-testid="clerk-sign-in" />
  },
}))

import Page from './page'

describe('sign-in page', () => {
  it('uses SEOlaQuest branding and a safe onboarding fallback', () => {
    render(<Page />)

    expect(screen.getByRole('heading', { name: /resume your customer hunt/i })).toBeVisible()
    expect(mocks.signIn).toHaveBeenCalledWith(expect.objectContaining({
      fallbackRedirectUrl: '/onboarding',
      signUpUrl: '/sign-up',
      appearance: expect.objectContaining({
        options: { autoFocus: false },
        elements: expect.objectContaining({
          rootBox: 'flex w-full justify-center',
          cardBox: 'w-full',
          card: 'w-full',
          formFieldInput: { minHeight: '44px' },
          formButtonPrimary: { minHeight: '44px' },
          formFieldAction: expect.objectContaining({ minHeight: '44px' }),
          formFieldInputShowPasswordButton: { minHeight: '44px', minWidth: '44px' },
          socialButtonsBlockButton: { minHeight: '44px' },
          socialButtonsIconButton: { minHeight: '44px', minWidth: '44px' },
          alternativeMethodsBlockButton: { minHeight: '44px' },
          otpCodeFieldInput: { minHeight: '44px', minWidth: '44px' },
          footerActionLink: expect.objectContaining({ minHeight: '44px' }),
          formResendCodeLink: expect.objectContaining({ minHeight: '44px' }),
        }),
      }),
    }))
  })
})
