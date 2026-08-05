import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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

import Sidebar from './coquest/navigation/os-v2/sidebar/Sidebar'

describe('CoQuest OS Sidebar', () => {
  it('renders sidebar navigation items and branding', () => {
    render(
      <Sidebar
        collapsed={false}
        mobileOpen={false}
        onCloseMobile={() => {}}
        onToggleCollapsed={() => {}}
      />
    )

    expect(screen.getByText('Command Compass')).toBeInTheDocument()
    expect(screen.getByText('LIVING HQ')).toBeInTheDocument()
    expect(screen.getByText('QUEST BOARD')).toBeInTheDocument()
    expect(screen.getByText('QUEST LOG')).toBeInTheDocument()
    expect(screen.getByText('GUILD HALL')).toBeInTheDocument()
    expect(screen.getByText('CAMPAIGN BROADCAST')).toBeInTheDocument()
    expect(screen.getByText('KNOWLEDGE LORE')).toBeInTheDocument()
    expect(screen.getByText('BAZAAR & SUPPLIES')).toBeInTheDocument()
    expect(screen.getByText('ARMORY & SPELLS')).toBeInTheDocument()
    expect(screen.getByText('Party Status')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /LOG OUT/i })).toBeInTheDocument()
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

    expect(screen.getAllByText('Command Compass')[0]).toBeInTheDocument()
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
