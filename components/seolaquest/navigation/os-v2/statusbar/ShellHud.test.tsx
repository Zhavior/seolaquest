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

function renderHud(user?: Parameters<typeof ShellHud>[0]['user']) {
  return render(<ShellHud user={user} />)
}

describe('ShellHud telemetry', () => {
  it('renders the account’s own progression rather than a demo player', () => {
    renderHud({
      name: 'Ada',
      level: 4,
      xp: 60,
      xpRequired: 340,
      questsRemaining: 18,
      maxCredits: 50,
      openQuests: 7,
    })

    // The mobile cluster abbreviates the same readings, so level appears twice.
    expect(screen.getAllByText('LVL 4').length).toBeGreaterThan(0)
    expect(screen.getByText('XP 60/340')).toBeInTheDocument()
    expect(screen.getByText('18/50 MP')).toBeInTheDocument()
    expect(screen.getByText('7 QUESTS')).toBeInTheDocument()
    // The badge is uppercased in CSS, so the DOM keeps the stored casing.
    expect(screen.getByText('Ada')).toBeInTheDocument()
  })

  it('reports an empty account honestly instead of falling back to sample numbers', () => {
    renderHud({
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
    // An empty board is information: the counter stays, showing zero.
    expect(screen.getByText('0 QUESTS')).toBeInTheDocument()
  })

  it('uses the live balance as the meter ceiling when it exceeds the recorded watermark', () => {
    // Potion top-ups can push the balance past `maxCredits` before the watermark
    // catches up, and a bar over 100% would render as a lie in the other direction.
    renderHud({ level: 2, xp: 10, xpRequired: 150, questsRemaining: 80, maxCredits: 50, openQuests: 0 })

    expect(screen.getByText('80/80 MP')).toBeInTheDocument()
  })

  it('falls back to an empty account rather than sample telemetry when no user is supplied', () => {
    renderHud(undefined)

    expect(screen.getByText('XP 0/100')).toBeInTheDocument()
    expect(screen.getByText('0/0 MP')).toBeInTheDocument()
    expect(screen.getByText('HUNTER')).toBeInTheDocument()
  })

  /*
   * The counter is of open *leads*, which live on the dashboard queue — not on
   * /app/runs, which is now the scan-run ledger and shows no leads at all. A
   * pill that counts one page and navigates to another is a dead end for anyone
   * who clicks it expecting to find the seven things it just promised.
   */
  it('points the quest counter at the queue it is counting', () => {
    renderHud({ openQuests: 7, questsRemaining: 1, maxCredits: 1 })

    const questLinks = screen.getAllByRole('link', { name: '7 QUESTS' })
    expect(questLinks.length).toBeGreaterThan(0)
    for (const link of questLinks) {
      expect(link).toHaveAttribute('href', '/app')
    }
  })

  it('names the abbreviated mobile readings for assistive tech', () => {
    renderHud({ level: 4, xp: 60, xpRequired: 340, questsRemaining: 18, maxCredits: 50, openQuests: 7 })

    // "18/50" and "L4" are what fits on a phone; the full reading is what a
    // screen reader gets.
    expect(screen.getByRole('img', { name: '18/50 MP' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'LVL 4' })).toBeInTheDocument()
  })
})
