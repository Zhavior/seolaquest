import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  isLoaded: true,
  toggle: vi.fn(() => false),
  userId: null as string | null,
}))

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <button type="button">User account</button>,
  useAuth: () => ({ isLoaded: mocks.isLoaded, userId: mocks.userId }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/sfx', () => ({
  sfx: {
    isEnabled: () => true,
    playCoinDrop: vi.fn(),
    playHoverBlip: vi.fn(),
    toggle: mocks.toggle,
  },
}))

import { LandingNav } from './LandingNav'

describe('LandingNav mobile usability', () => {
  beforeEach(() => {
    mocks.isLoaded = true
    mocks.userId = null
    mocks.toggle.mockClear()
  })

  it('keeps visitor authentication actions present with 44px targets below 640px', () => {
    render(<LandingNav />)

    const nav = screen.getByRole('navigation', { name: 'Landing navigation' })
    const signIn = screen.getByRole('link', { name: 'Sign in' })
    const createAccount = screen.getByRole('link', { name: 'Create account' })
    const soundToggle = screen.getByRole('button', { name: 'Turn sound effects off' })

    expect(nav).toHaveClass('pt-[env(safe-area-inset-top)]')
    expect(signIn).toBeVisible()
    expect(createAccount).toBeVisible()
    expect(signIn).toHaveClass('min-h-11')
    expect(createAccount).toHaveClass('min-h-11', 'text-xs', 'text-black')
    expect(createAccount).not.toHaveClass('text-[11px]', 'text-white')
    expect(soundToggle).toHaveClass('min-h-11', 'min-w-11')
    expect(signIn.className).not.toContain('hidden')
    expect(createAccount.className).not.toContain('hidden')
  })

  it('gives the sound control a non-hover interaction and explicit state', async () => {
    const user = userEvent.setup()
    render(<LandingNav />)

    const soundToggle = screen.getByRole('button', { name: 'Turn sound effects off' })
    expect(soundToggle).toHaveAttribute('aria-pressed', 'true')

    await user.click(soundToggle)

    expect(mocks.toggle).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Turn sound effects on' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps authenticated actions touch-sized too', () => {
    mocks.userId = 'user_123'
    render(<LandingNav />)

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: 'User account' }).parentElement).toHaveClass('min-h-11', 'min-w-11')
  })
})
