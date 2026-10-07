import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const signOutMock = vi.fn()
const prefetchMock = vi.fn()

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: signOutMock }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/app',
  useRouter: () => ({ prefetch: prefetchMock }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import Sidebar, { SidebarNavigation } from './Sidebar'

function renderSidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  return render(<Sidebar {...props} />)
}

describe('SEOlaQuest OS Sidebar', () => {
  it('renders the navigation index and branding', () => {
    renderSidebar()

    expect(screen.getByText('Quest journal')).toBeInTheDocument()
    expect(screen.getByText('LIVING HQ')).toBeInTheDocument()
    expect(screen.getByText('QUEST BOARD')).toBeInTheDocument()
    expect(screen.getByText('SCAN RUNS')).toBeInTheDocument()
    expect(screen.getByText('QUEST LOG')).toBeInTheDocument()
    expect(screen.getByText('GUILD HALL')).toBeInTheDocument()
    expect(screen.getByText('CAMPAIGN BROADCAST')).toBeInTheDocument()
    expect(screen.getByText('KNOWLEDGE LORE')).toBeInTheDocument()
    expect(screen.getByText('BAZAAR & SUPPLIES')).toBeInTheDocument()
    expect(screen.getByText('ARMORY & SPELLS')).toBeInTheDocument()
    expect(screen.queryByText('Party Status')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /LIVING HQ/ })).toHaveAttribute('aria-current', 'page')
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

  it('warms a destination when the user shows intent', async () => {
    prefetchMock.mockClear()
    renderSidebar()

    await userEvent.hover(screen.getByRole('link', { name: /QUEST BOARD/ }))

    expect(prefetchMock).toHaveBeenCalledWith('/app/quests')
  })

  it('shows Admin only when the server authorizes it, including the mobile drawer and collapsed rail', () => {
    const ordinary = renderSidebar()
    expect(screen.queryByRole('link', { name: /^Admin/ })).not.toBeInTheDocument()
    ordinary.unmount()

    const owner = renderSidebar({ isAdmin: true })
    expect(screen.getByRole('link', { name: /^Admin/ })).toHaveAttribute('href', '/app/admin')
    owner.unmount()

    const collapsed = renderSidebar({ isAdmin: true, collapsed: true })
    expect(screen.getByRole('link', { name: /^Admin/ })).toHaveAttribute('href', '/app/admin')
    collapsed.unmount()

    const mobile = render(<SidebarNavigation mobile isAdmin />)
    expect(screen.getByRole('link', { name: /^Admin/ })).toHaveAttribute('href', '/app/admin')
    mobile.unmount()

    render(<SidebarNavigation mobile />)
    expect(screen.queryByRole('link', { name: /^Admin/ })).not.toBeInTheDocument()
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

  /*
   * The app has one look now — the landing page's Dusk — so the rail no longer
   * offers a theme picker, and each destination carries its painted emblem from
   * the shared sprite instead of a generic line icon.
   */
  it('offers no theme picker and draws each destination with its emblem', () => {
    const { container } = renderSidebar()

    expect(screen.queryByRole('radiogroup', { name: 'Interface theme' })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    const questBoard = screen.getByRole('link', { name: /QUEST BOARD/ })
    expect(questBoard.querySelector('use')).toHaveAttribute('href', '#i-scroll')
    expect(container.querySelectorAll('a use')).toHaveLength(9)
  })

  it('names every destination in the collapsed rail, where only emblems show', () => {
    renderSidebar({ collapsed: true })

    expect(screen.getByRole('link', { name: 'SCAN RUNS' })).toHaveAttribute('href', '/app/runs')
    expect(screen.getByRole('link', { name: 'LIVING HQ' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('SidebarNavigation in the mobile drawer', () => {
  it('closes the drawer from its own header and after a destination is chosen', async () => {
    const onNavigate = vi.fn()
    render(<SidebarNavigation mobile onNavigate={onNavigate} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(onNavigate).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('link', { name: /LIVING HQ/ }))
    expect(onNavigate).toHaveBeenCalledTimes(2)
  })
})
