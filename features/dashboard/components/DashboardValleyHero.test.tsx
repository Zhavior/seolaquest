import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DashboardValleyHero } from './DashboardValleyHero'
import type { DashboardLead } from '@/features/dashboard/types'

function lead(id: string, evaluationStatus: string, score: number): DashboardLead {
  return {
    id,
    platform: 'X',
    author: 'author',
    content: 'content',
    matched: 'keyword',
    url: 'https://example.com',
    sourceCreatedAt: null,
    aurora: { score, confidence: 0.5, recommendedAction: 'REVIEW', evaluationStatus },
  }
}

const base = { name: 'Hunter', level: 2, title: 'Lead Hunter', filter: 'all' as const, onFilter: () => {} }

describe('DashboardValleyHero', () => {
  it('says what the page is and what is waiting, and works without WebGL', () => {
    render(<DashboardValleyHero {...base} leads={[]} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Home')
    expect(screen.getByText('No leads to look at yet.')).toBeInTheDocument()
    // Level and title are part of the optional game layer, off by default.
    expect(screen.getByText('Hunter')).toBeInTheDocument()
    expect(screen.queryByText(/Level 2/)).toBeNull()
    expect(screen.getByText('Each light will stand for one of your newest leads')).toBeInTheDocument()
  })

  it('always offers a way to stop the animation (WCAG 2.2.2)', () => {
    render(<DashboardValleyHero {...base} leads={[]} />)
    const pause = screen.getByRole('button', { name: 'Pause animation' })
    expect(pause).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(pause)
    expect(screen.getByRole('button', { name: 'Play animation' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('counts leads per chip from live scores only', () => {
    const leads = [lead('a', 'LIVE', 86), lead('b', 'FALLBACK', 90), lead('c', 'LIVE', 44), lead('d', 'LIVE', 80)]
    render(<DashboardValleyHero {...base} leads={leads} />)
    expect(screen.getByRole('button', { name: /All leads/ })).toHaveTextContent('4')
    // The FALLBACK 90 is not a measurement, so it counts as unscored, not 80+.
    expect(screen.getByRole('button', { name: /Score 80\+/ })).toHaveTextContent('2')
    expect(screen.getByRole('button', { name: /No score yet/ })).toHaveTextContent('1')
  })

  it('reports the chosen filter and marks the active chip', () => {
    const onFilter = vi.fn()
    render(<DashboardValleyHero {...base} filter="unscored" onFilter={onFilter} leads={[lead('a', 'LIVE', 86)]} />)
    expect(screen.getByRole('button', { name: /No score yet/ })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /Score 80\+/ }))
    expect(onFilter).toHaveBeenCalledWith('engage')
  })

  it('lights at most four beacons', () => {
    const leads = ['a', 'b', 'c', 'd', 'e'].map((id) => lead(id, 'LIVE', 70))
    const { rerender } = render(<DashboardValleyHero {...base} leads={leads.slice(0, 2)} />)
    expect(screen.getByText('Each light is one of your 2 newest leads')).toBeInTheDocument()
    rerender(<DashboardValleyHero {...base} leads={leads} />)
    expect(screen.getByText('Each light is one of your 4 newest leads')).toBeInTheDocument()
  })
})
