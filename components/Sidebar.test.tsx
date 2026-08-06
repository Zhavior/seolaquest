import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const signOutMock = vi.fn()

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: signOutMock }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/app',
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import Sidebar from './seolaquest/navigation/os-v2/sidebar/Sidebar'

describe('SEOlaQuest OS Sidebar', () => {
  it('renders sidebar navigation items and branding', () => {
    render(
      <Sidebar
        collapsed={false}
        mobileOpen={false}
        onCloseMobile={() => {}}
        onToggleCollapsed={() => {}}
      />
    )

    // Desktop rail carries the full brand; the mobile top bar uses the short "SEOLQ".
    expect(screen.getByText('SEO la Quest')).toBeInTheDocument()
    expect(screen.getByText('LIVING HQ')).toBeInTheDocument()
    expect(screen.getByText('QUEST BOARD')).toBeInTheDocument()
    expect(screen.getByText('QUEST LOG')).toBeInTheDocument()
    expect(screen.getByText('GUILD HALL')).toBeInTheDocument()
    expect(screen.getByText('CAMPAIGN BROADCAST')).toBeInTheDocument()
    expect(screen.getByText('KNOWLEDGE LORE')).toBeInTheDocument()
    expect(screen.getByText('BAZAAR & SUPPLIES')).toBeInTheDocument()
    expect(screen.getByText('ARMORY & SPELLS')).toBeInTheDocument()
    expect(screen.getByText('Party Status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /LOG OUT/i })).toBeInTheDocument()
  })

  it('ends the Clerk session instead of only linking to /sign-in', async () => {
    signOutMock.mockClear()

    render(
      <Sidebar
        collapsed={false}
        mobileOpen={false}
        onCloseMobile={() => {}}
        onToggleCollapsed={() => {}}
      />
    )

    const logOut = screen.getByRole('button', { name: /LOG OUT/i })
    expect(logOut).not.toHaveAttribute('href')

    await userEvent.click(logOut)

    expect(signOutMock).toHaveBeenCalledWith({ redirectUrl: '/' })
  })

  it('renders mobile open state and handles close', () => {
    const onCloseMobile = vi.fn()
    render(
      <Sidebar
        collapsed={false}
        mobileOpen={true}
        onCloseMobile={onCloseMobile}
        onToggleCollapsed={() => {}}
      />
    )

    expect(screen.getAllByText('SEO la Quest')[0]).toBeInTheDocument()
  })

  it('renders collapsed state with expand toggle button', () => {
    const onToggleCollapsed = vi.fn()
    render(
      <Sidebar
        collapsed={true}
        mobileOpen={false}
        onCloseMobile={() => {}}
        onToggleCollapsed={onToggleCollapsed}
      />
    )

    expect(screen.getByRole('button', { name: 'Expand navigation' })).toBeInTheDocument()
  })
})
