import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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

const base = { name: 'Hunter', level: 2, title: 'Lead Hunter', credits: '3/10', plan: 'NO ACTIVE PLAN' }

describe('DashboardValleyHero', () => {
  it('keeps the header content readable without WebGL', () => {
    render(<DashboardValleyHero {...base} leads={[]} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('One useful step at a time.')
    expect(screen.getByText('Hunter · Lv 2 · Lead Hunter')).toBeInTheDocument()
    expect(screen.getByText('3/10')).toBeInTheDocument()
    expect(screen.getByText('Beacons light up as leads arrive.')).toBeInTheDocument()
  })

  it('says when a beacon has no live score', () => {
    render(<DashboardValleyHero {...base} leads={[lead('a', 'LIVE', 86), lead('b', 'FALLBACK', 50)]} />)
    expect(screen.getByText('Beacons: your 2 newest leads · – means no live score yet')).toBeInTheDocument()
  })

  it('names the live score when every shown lead has one', () => {
    render(<DashboardValleyHero {...base} leads={[lead('a', 'LIVE', 86)]} />)
    expect(screen.getByText('Beacons: your newest lead · number is the live Aurora score')).toBeInTheDocument()
  })

  it('counts at most four leads', () => {
    const leads = ['a', 'b', 'c', 'd', 'e'].map((id) => lead(id, 'LIVE', 70))
    const { rerender } = render(<DashboardValleyHero {...base} leads={leads.slice(0, 2)} />)
    rerender(<DashboardValleyHero {...base} leads={leads} />)
    expect(screen.getByText('Beacons: your 4 newest leads · number is the live Aurora score')).toBeInTheDocument()
  })
})
