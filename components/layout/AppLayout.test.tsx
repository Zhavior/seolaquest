import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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

import AppLayout from './AppLayout'

describe('Neobrutalist AppLayout Component', () => {
  it('renders Universal HUD elements correctly', () => {
    render(
      <AppLayout>
        <div>Content Shell</div>
      </AppLayout>
    )

    // Brand and Identity
    expect(screen.getByText('COQUEST')).toBeInTheDocument()
    expect(screen.getByText('REINALD')).toBeInTheDocument()
    expect(screen.getByText('LVL 10')).toBeInTheDocument()

    // Mana Vault HUD
    expect(screen.getByText(/Vault:/i)).toBeInTheDocument()
    expect(screen.getByText('70/100 MP')).toBeInTheDocument()
    expect(screen.getByText('LEGEND')).toBeInTheDocument()

    // Health Dot & Billing CTA
    expect(screen.getByText('RADAR ACTIVE')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /RECHARGE/i })).toHaveAttribute('href', '/billing')
  })

  it('renders Neobrutalist Sidebar (Quest Compass) elements', () => {
    render(
      <AppLayout>
        <div>Content Shell</div>
      </AppLayout>
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
    expect(screen.getByRole('link', { name: /LOG OUT/i })).toBeInTheDocument()
  })

  it('renders children within main container', () => {
    render(
      <AppLayout>
        <div data-testid="page-child">Test Page Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('page-child')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
