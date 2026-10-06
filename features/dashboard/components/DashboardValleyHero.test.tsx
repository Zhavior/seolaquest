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
  it('names the hunter in the heading and works without WebGL', () => {
    render(<DashboardValleyHero {...base} leads={[]} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hunter · Lv 2 · Lead Hunter')
    expect(screen.getByText('Beacons light up as leads arrive')).toBeInTheDocument()
  })

  it('counts leads per chip from live scores only', () => {
    const leads = [lead('a', 'LIVE', 86), lead('b', 'FALLBACK', 90), lead('c', 'LIVE', 44), lead('d', 'LIVE', 80)]
    render(<DashboardValleyHero {...base} leads={leads} />)
    expect(screen.getByRole('button', { name: /All leads/ })).toHaveTextContent('4')
    // The FALLBACK 90 is not a measurement, so it counts as unscored, not 80+.
    expect(screen.getByRole('button', { name: /Score 80\+/ })).toHaveTextContent('2')
    expect(screen.getByRole('button', { name: /Unscored/ })).toHaveTextContent('1')
  })

  it('reports the chosen filter and marks the active chip', () => {
    const onFilter = vi.fn()
    render(<DashboardValleyHero {...base} filter="unscored" onFilter={onFilter} leads={[lead('a', 'LIVE', 86)]} />)
    expect(screen.getByRole('button', { name: /Unscored/ })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /Score 80\+/ }))
    expect(onFilter).toHaveBeenCalledWith('engage')
  })

  it('lights at most four beacons', () => {
    const leads = ['a', 'b', 'c', 'd', 'e'].map((id) => lead(id, 'LIVE', 70))
    const { rerender } = render(<DashboardValleyHero {...base} leads={leads.slice(0, 2)} />)
    expect(screen.getByText('2 of 4 beacons lit · one per newest lead')).toBeInTheDocument()
    rerender(<DashboardValleyHero {...base} leads={leads} />)
    expect(screen.getByText('4 of 4 beacons lit · one per newest lead')).toBeInTheDocument()
  })
})
