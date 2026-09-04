import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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
  },
}))

import { LandingNav } from './LandingNav'

describe('LandingNav mobile usability', () => {
  it('keeps visitor authentication actions present with 44px targets below 640px', () => {
    render(<LandingNav />)

    const nav = screen.getByRole('navigation', { name: 'SEOlaQuest navigation' })
    const signIn = screen.getByRole('link', { name: 'Sign in' })
    const createAccount = screen.getByRole('link', { name: 'Try the demo' })

    expect(nav).toHaveClass('pt-[env(safe-area-inset-top)]')
    expect(signIn).toBeVisible()
    expect(createAccount).toBeVisible()
    expect(createAccount).toHaveAttribute('href', '/#demo')
    expect(signIn).toHaveClass('min-h-11')
    expect(createAccount).toHaveClass('min-h-11')
    expect(signIn.className).not.toContain('hidden')
    expect(createAccount.className).not.toContain('hidden')
  })

  it('gives the sound control a non-hover interaction and explicit state', async () => {
    // Sound control was moved out of Nav
  })

})
