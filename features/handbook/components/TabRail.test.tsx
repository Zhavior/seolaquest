import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const nav = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }))

import { TabRail } from './TabRail'
import { VOLUMES, volumeForPath } from '../tokens'

describe('TabRail', () => {
  beforeEach(() => {
    nav.pathname = '/'
  })

  it('links every volume once, as a named navigation', () => {
    render(<TabRail />)
    expect(screen.getByRole('navigation', { name: 'Handbook sections' })).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(VOLUMES.length)
  })

  it('marks Start current on the home page before any scrolling', () => {
    render(<TabRail />)
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Quests' })).not.toHaveAttribute('aria-current')
  })

  it.each([
    ['/pricing', 'Inventory'],
    ['/radar', 'Try it'],
    ['/blog/some-post', 'Field Notes'],
    ['/status', 'Errata'],
    ['/sign-in', 'Start'],
  ])('marks the owning volume current on %s', (pathname, label) => {
    nav.pathname = pathname
    render(<TabRail />)
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1)
  })
})

describe('volumeForPath', () => {
  it('falls back to Errata for fine-print routes', () => {
    expect(volumeForPath('/terms')).toBe('errata')
    expect(volumeForPath('/privacy')).toBe('errata')
    expect(volumeForPath('/api-terms')).toBe('errata')
  })
})
