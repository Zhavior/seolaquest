import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    disconnect() {}
    observe() {}
    unobserve() {}
  })
})

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/sfx', () => ({
  sfx: {
    isEnabled: () => false,
    playBountyUnlock: vi.fn(),
    playCoinDrop: vi.fn(),
    playHoverBlip: vi.fn(),
    playRadarBlip: vi.fn(),
  },
}))

import { LandingHero } from './LandingHero'

describe('LandingHero mobile tabs', () => {
  it('shows the product brief before the matches board', () => {
    render(<LandingHero />)

    const briefTab = screen.getByRole('button', { name: 'Quest brief' })
    const matchesTab = screen.getByRole('button', { name: 'Matches (2)' })

    expect(briefTab).toHaveClass('bg-accent')
    expect(matchesTab).not.toHaveClass('bg-accent')
    expect(screen.getByRole('heading', { level: 1 }).parentElement).toHaveClass('block')

    fireEvent.click(matchesTab)

    expect(matchesTab).toHaveClass('bg-accent')
    expect(briefTab).not.toHaveClass('bg-accent')
  })
})
