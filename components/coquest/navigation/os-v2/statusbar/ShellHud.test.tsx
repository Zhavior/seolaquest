import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import ShellHud from './ShellHud'

function renderStatusBar(user?: Parameters<typeof ShellHud>[0]['user']) {
  return render(<ShellHud user={user} />)
}

describe('ShellHud telemetry', () => {
  it('renders the account’s own progression rather than a demo player', () => {
    renderStatusBar({
      name: 'Ada',
      level: 4,
      xp: 60,
      xpRequired: 340,
      questsRemaining: 18,
      maxCredits: 50,
      openQuests: 7,
    })

    expect(screen.getAllByText('LVL 4').length).toBeGreaterThan(0)
    expect(screen.getByText('XP 60/340')).toBeInTheDocument()
    expect(screen.getByText('18/50 MP')).toBeInTheDocument()
    expect(screen.getByText('7 QUESTS')).toBeInTheDocument()
    // The badge is uppercased in CSS, so the DOM keeps the stored casing.
    expect(screen.getByText('Ada')).toBeInTheDocument()
  })

  it('reports an empty account honestly instead of falling back to sample numbers', () => {
    renderStatusBar({
      name: 'Newcomer',
      level: 1,
      xp: 0,
      xpRequired: 100,
      questsRemaining: 0,
      maxCredits: 0,
      openQuests: 0,
    })

    expect(screen.getByText('XP 0/100')).toBeInTheDocument()
    expect(screen.getByText('0/0 MP')).toBeInTheDocument()
    expect(screen.getByText('0 QUESTS')).toBeInTheDocument()
  })

  it('uses the live balance as the meter ceiling when it exceeds the recorded watermark', () => {
    // Potion top-ups can push the balance past `maxCredits` before the watermark
    // catches up, and a bar over 100% would render as a lie in the other direction.
    renderStatusBar({ level: 2, xp: 10, xpRequired: 150, questsRemaining: 80, maxCredits: 50, openQuests: 0 })

    expect(screen.getByText('80/80 MP')).toBeInTheDocument()
  })

  it('shows nothing rather than sample telemetry when no user is supplied', () => {
    renderStatusBar(undefined)

    expect(screen.getByText('XP 0/100')).toBeInTheDocument()
    expect(screen.getByText('0/0 MP')).toBeInTheDocument()
    expect(screen.getByText('HUNTER')).toBeInTheDocument()
  })
})
