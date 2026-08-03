import type { MouseEvent, ReactNode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  pathname: '/app',
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
    onNavigate,
    ...props
  }: {
    children: ReactNode
    href: string
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
    onNavigate?: () => void
  }) => (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          event.preventDefault()
          onNavigate?.()
        }
      }}
      {...props}
    >
      {children}
    </a>
  ),
}))

vi.mock('@clerk/nextjs', () => ({
  SignOutButton: ({ children }: { children: ReactNode }) => children,
  useUser: () => ({
    isLoaded: true,
    user: {
      fullName: 'Ada Hunter',
      primaryEmailAddress: { emailAddress: 'ada@example.com' },
    },
  }),
}))

import { Sidebar } from './Sidebar'

function renderSidebar() {
  return render(
    <>
      <Sidebar />
      <main data-authenticated-main>
        <button type="button">Background action</button>
      </main>
    </>,
  )
}

describe('Sidebar mobile navigation', () => {
  beforeEach(() => {
    mocks.pathname = '/app'
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not mount the mobile drawer while closed and exposes explicit control state', () => {
    renderSidebar()

    const opener = screen.getByRole('button', { name: 'Open main navigation' })
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    expect(opener).toHaveAttribute('aria-controls', 'mobile-navigation-dialog')
    expect(opener).toHaveClass('min-h-11', 'min-w-11')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener.parentElement).toHaveClass('lg:hidden')
    expect(screen.getByRole('complementary', { name: 'Main navigation' })).toHaveClass('hidden', 'lg:flex')
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)')
  })

  it('moves focus into the drawer and contains Tab focus at both boundaries', async () => {
    const user = userEvent.setup()
    renderSidebar()

    const opener = screen.getByRole('button', { name: 'Open main navigation' })
    await user.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'CoQuest' })
    const closeButton = within(dialog).getByRole('button', { name: 'Close main navigation' })
    const logOut = within(dialog).getByRole('button', { name: 'Log out' })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(opener).toHaveAttribute('aria-expanded', 'true')
    expect(closeButton).toHaveFocus()

    await user.tab({ shift: true })
    expect(logOut).toHaveFocus()
    await user.tab()
    expect(closeButton).toHaveFocus()
  })

  it('makes the authenticated background inert and restores page scrolling when closed', async () => {
    const user = userEvent.setup()
    renderSidebar()

    const opener = screen.getByRole('button', { name: 'Open main navigation' })
    const mobileHeader = opener.parentElement
    const authenticatedMain = document.querySelector('[data-authenticated-main]')

    await user.click(opener)

    expect(mobileHeader).toHaveAttribute('inert')
    expect(authenticatedMain).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close main navigation' }))

    expect(mobileHeader).not.toHaveAttribute('inert')
    expect(authenticatedMain).not.toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('')
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('closes on Escape and restores focus to the menu opener', async () => {
    const user = userEvent.setup()
    renderSidebar()

    const opener = screen.getByRole('button', { name: 'Open main navigation' })
    await user.click(opener)

    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close main navigation' })).toHaveFocus()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(opener).toHaveFocus()
    expect(opener).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps the mobile navigation controls available to touch input', async () => {
    const user = userEvent.setup()
    renderSidebar()

    const opener = screen.getByRole('button', { name: 'Open main navigation' })
    expect(opener).toHaveClass('min-h-11', 'min-w-11')

    await user.pointer({ keys: '[TouchA]', target: opener })

    const dialog = screen.getByRole('dialog')
    const closeButton = within(dialog).getByRole('button', { name: 'Close main navigation' })
    expect(closeButton).toHaveClass('min-h-11', 'min-w-11')

    await user.pointer({ keys: '[TouchA]', target: closeButton })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('closes for route selection and backdrop activation', async () => {
    const user = userEvent.setup()
    renderSidebar()

    const opener = screen.getByRole('button', { name: 'Open main navigation' })
    await user.click(opener)
    let dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('link', { name: 'Scan Runs' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(opener)
    dialog = screen.getByRole('dialog')
    fireEvent.mouseDown(dialog)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
