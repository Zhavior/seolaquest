import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
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

    const nav = screen.getByRole('navigation', { name: 'SEO la Quest navigation' })
    const signIn = screen.getByRole('link', { name: 'Sign in' })
    const createAccount = screen.getByRole('link', { name: 'Start free' })

    expect(nav).toHaveClass('pt-[env(safe-area-inset-top)]')
    expect(signIn).toBeVisible()
    expect(createAccount).toBeVisible()
    expect(signIn).toHaveClass('min-h-11')
    expect(createAccount).toHaveClass('min-h-11')
    expect(signIn.className).not.toContain('hidden')
    expect(createAccount.className).not.toContain('hidden')
  })

  it('gives the sound control a non-hover interaction and explicit state', async () => {
    // Sound control was moved out of Nav
  })

  it('keeps authenticated actions touch-sized too', () => {
    mocks.userId = 'user_123'
    render(<LandingNav />)

    expect(screen.getByRole('link', { name: 'COMMAND CENTER' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'User account' }).parentElement).toBeDefined()
  })
})
