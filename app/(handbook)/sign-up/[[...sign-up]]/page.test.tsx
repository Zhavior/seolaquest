import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ signUp: vi.fn() }))

vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
  SignUp: (props: unknown) => {
    mocks.signUp(props)
    return <div data-testid="clerk-sign-up" />
  },
}))

import Page from './page'

describe('sign-up page', () => {
  it('uses SEOlaQuest branding and sends new accounts to the early-access page', () => {
    render(<Page />)

    expect(screen.getByRole('heading', { name: /join the early access/i })).toBeVisible()
    expect(screen.getByRole('link', { name: /see the sample scan/i })).toHaveAttribute('href', '/radar')
    expect(screen.getByRole('list', { name: /six short steps/i }).children).toHaveLength(6)
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({
      fallbackRedirectUrl: '/welcome',
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
