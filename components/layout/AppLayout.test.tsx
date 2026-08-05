import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const signOutMock = vi.fn()

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: signOutMock }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { ThemeProvider } from '@/components/theme/ThemeProvider'
import AppLayout from './AppLayout'

describe('Neobrutalist AppLayout Component', () => {
  it('renders Universal HUD elements correctly', () => {
    render(
      <AppLayout>
        <div>Content Shell</div>
      </AppLayout>,
      { wrapper: ThemeProvider },
    )

    // Brand and Identity
    expect(screen.getByText('COQUEST')).toBeInTheDocument()
    expect(screen.getByText('REINALD')).toBeInTheDocument()
    expect(screen.getAllByText('LVL 10').length).toBeGreaterThan(0)

    // Telemetry HUD
    expect(screen.getByText('70/100 MP')).toBeInTheDocument()
    expect(screen.getByText('12 QUESTS')).toBeInTheDocument()
    expect(screen.getByText('XP 1,250')).toBeInTheDocument()

    // Billing CTA
    // Deep-linked to the Founder offer so Recharge lands on the card, not the page top.
    expect(screen.getByRole('link', { name: /Recharge/i })).toHaveAttribute(
      'href',
      '/billing?offer=founder',
    )
  })

  it('renders Neobrutalist Sidebar (Quest Compass) elements', () => {
    render(
      <AppLayout>
        <div>Content Shell</div>
      </AppLayout>,
      { wrapper: ThemeProvider },
    )

    // Sidebar items
    expect(screen.getByText('Command Compass')).toBeInTheDocument()
    expect(screen.getByText('LIVING HQ')).toBeInTheDocument()
    expect(screen.getByText('QUEST BOARD')).toBeInTheDocument()
    expect(screen.getByText('QUEST LOG')).toBeInTheDocument()
    expect(screen.getByText('GUILD HALL')).toBeInTheDocument()
    expect(screen.getByText('CAMPAIGN BROADCAST')).toBeInTheDocument()
    expect(screen.getByText('KNOWLEDGE LORE')).toBeInTheDocument()
    expect(screen.getByText('BAZAAR & SUPPLIES')).toBeInTheDocument()
    expect(screen.getByText('ARMORY SETTINGS')).toBeInTheDocument()

    // Party Quick Status Widget & Log Out
    expect(screen.getByText('Party Status')).toBeInTheDocument()
    expect(screen.getByText('3/3 Active')).toBeInTheDocument()
    expect(
      screen.getByText('Scouts currently patrolling r/SaaS and Twitter streams.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /LOG OUT/i })).toBeInTheDocument()
  })

  it('ends the Clerk session instead of only linking to /sign-in', async () => {
    signOutMock.mockClear()

    render(
      <AppLayout>
        <div>Content Shell</div>
      </AppLayout>,
      { wrapper: ThemeProvider },
    )

    const logOut = screen.getByRole('button', { name: /LOG OUT/i })
    expect(logOut).not.toHaveAttribute('href')

    await userEvent.click(logOut)

    expect(signOutMock).toHaveBeenCalledWith({ redirectUrl: '/' })
  })

  it('renders children within main container', () => {
    render(
      <AppLayout>
        <div data-testid="page-child">Test Page Content</div>
      </AppLayout>,
      { wrapper: ThemeProvider },
    )

    expect(screen.getByTestId('page-child')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
