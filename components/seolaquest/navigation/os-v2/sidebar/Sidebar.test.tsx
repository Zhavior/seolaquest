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

import { ThemeProvider } from '@/components/theme/ThemeProvider'
import Sidebar, { SidebarNavigation } from './Sidebar'

// The theme picker reads `useTheme()`, so the rail cannot render outside a
// provider. In the app that provider lives in the root layout, above the shell.
function renderSidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  return render(<Sidebar {...props} />, { wrapper: ThemeProvider })
}

describe('SEOlaQuest OS Sidebar', () => {
  it('renders the navigation index and branding', () => {
    renderSidebar()

    expect(screen.getByText('SEOlaQuest')).toBeInTheDocument()
    expect(screen.getByText('LIVING HQ')).toBeInTheDocument()
    expect(screen.getByText('QUEST BOARD')).toBeInTheDocument()
    expect(screen.getByText('SCAN RUNS')).toBeInTheDocument()
    expect(screen.getByText('QUEST LOG')).toBeInTheDocument()
    expect(screen.getByText('GUILD HALL')).toBeInTheDocument()
    expect(screen.getByText('CAMPAIGN BROADCAST')).toBeInTheDocument()
    expect(screen.getByText('KNOWLEDGE LORE')).toBeInTheDocument()
    expect(screen.getByText('BAZAAR & SUPPLIES')).toBeInTheDocument()
    expect(screen.getByText('ARMORY & SPELLS')).toBeInTheDocument()
    expect(screen.getByText('Party Status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /LOG OUT/i })).toBeInTheDocument()
  })

  /*
   * QUEST BOARD used to point at /app/runs — the scan-run ledger — and carried a
   * badge reading '12' that was a hardcoded string, identical on every account
   * including one with nothing on its board. Both were the same failure: the rail
   * describing something other than what the destination actually holds.
   */
  it('sends QUEST BOARD to the board and SCAN RUNS to the run ledger', () => {
    renderSidebar()

    expect(screen.getByRole('link', { name: /QUEST BOARD/ })).toHaveAttribute('href', '/app/quests')
    expect(screen.getByRole('link', { name: /SCAN RUNS/ })).toHaveAttribute('href', '/app/runs')
    expect(screen.getByRole('link', { name: /QUEST BOARD/ })).not.toHaveTextContent('12')
  })

  it('ends the Clerk session instead of only linking to /sign-in', async () => {
    signOutMock.mockClear()

    renderSidebar()

    const logOut = screen.getByRole('button', { name: /LOG OUT/i })
    expect(logOut).not.toHaveAttribute('href')

    await userEvent.click(logOut)

    expect(signOutMock).toHaveBeenCalledWith({ redirectUrl: '/' })
  })

  it('reports the collapse state through the toggle it offers', async () => {
    const onToggleCollapsed = vi.fn()
    const { unmount } = renderSidebar({ collapsed: false, onToggleCollapsed })

    await userEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }))
    expect(onToggleCollapsed).toHaveBeenCalledTimes(1)
    unmount()

    renderSidebar({ collapsed: true, onToggleCollapsed })

    await userEvent.click(screen.getByRole('button', { name: 'Expand navigation' }))
    expect(onToggleCollapsed).toHaveBeenCalledTimes(2)
  })

  describe('theme picker', () => {
    it('exposes the themes as a single radio group with the active one checked', () => {
      renderSidebar()

      const group = screen.getByRole('radiogroup', { name: 'Interface theme' })
      const options = screen.getAllByRole('radio')

      expect(options).toHaveLength(3)
      expect(options.every((option) => group.contains(option))).toBe(true)
      // Parchment is the default, so it is the one reporting itself as checked.
      expect(screen.getByRole('radio', { name: 'Parchment (light)' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'Grey Mode (dark)' })).not.toBeChecked()
    })

    it('moves the checked state to the theme the user picks', async () => {
      renderSidebar()

      await userEvent.click(screen.getByRole('radio', { name: 'Midnight Blue (dark)' }))

      expect(screen.getByRole('radio', { name: 'Midnight Blue (dark)' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'Parchment (light)' })).not.toBeChecked()
      expect(document.documentElement).toHaveAttribute('data-theme', 'blue')
    })

    it('keeps the swatches named and grouped in the collapsed rail', () => {
      renderSidebar({ collapsed: true })

      // Collapsed swatches are colour only — the name has to come from ARIA.
      const group = screen.getByRole('radiogroup', { name: 'Interface theme' })
      expect(screen.getAllByRole('radio')).toHaveLength(3)
      expect(group.contains(screen.getByRole('radio', { name: 'Grey Mode (dark)' }))).toBe(true)
    })
  })
})

describe('SidebarNavigation in the mobile drawer', () => {
  it('closes the drawer from its own header and after a destination is chosen', async () => {
    const onNavigate = vi.fn()
    render(<SidebarNavigation mobile onNavigate={onNavigate} />, { wrapper: ThemeProvider })

    await userEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(onNavigate).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('link', { name: /LIVING HQ/ }))
    expect(onNavigate).toHaveBeenCalledTimes(2)
  })
})
