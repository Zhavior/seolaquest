import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ signUp: vi.fn() }))

vi.mock('@clerk/nextjs', () => ({
  SignUp: (props: unknown) => {
    mocks.signUp(props)
    return <div data-testid="clerk-sign-up" />
  },
}))

import Page from './page'

describe('sign-up page', () => {
  it('uses SEOlaQuest branding and sends new accounts to onboarding', () => {
    render(<Page />)

    expect(screen.getByRole('heading', { name: /start one focused customer hunt/i })).toBeVisible()
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({
      fallbackRedirectUrl: '/onboarding',
      signInUrl: '/sign-in',
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
