import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BountyCard from './BountyCard'

const lead = {
  id: 'lead-1',
  platform: 'REDDIT',
  author: 'u/measured',
  content: 'Looking for a CRM',
  matched: 'CRM',
  url: 'https://reddit.com/example',
  sourceCreatedAt: '2026-07-29T12:00:00.000Z',
    aurora: null,
}

describe('BountyCard', () => {
  it('labels the record as a source match without derived intent, engagement, rewards, or qualification', () => {
    render(
      <BountyCard
        lead={lead}
        isPending={false}
        onClaim={vi.fn()}
        onGenerateAIReply={vi.fn()}
        onExportToCRM={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByText('u/measured')).toBeInTheDocument()
    expect(screen.getByText(/source match: crm/i)).toBeInTheDocument()
    expect(screen.getByText(/has not measured an intent score/i)).toBeInTheDocument()
    expect(screen.queryByText(/intent \d/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/qualified lead|replies|retweets|upvotes|likes|reward:|lvl \d/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open stored source post by u\/measured/i })).toHaveAttribute(
      'href',
      lead.url,
    )
  })

  it('labels actions by their actual server intent', () => {
    const onClaim = vi.fn()
    const onGenerateAIReply = vi.fn()
    const onExportToCRM = vi.fn()
    render(
      <BountyCard
        lead={lead}
        isPending={false}
        onClaim={onClaim}
        onGenerateAIReply={onGenerateAIReply}
        onExportToCRM={onExportToCRM}
        onDismiss={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /mark contacted/i }))
    fireEvent.click(screen.getByRole('button', { name: /request ai draft/i }))
    fireEvent.click(screen.getByRole('button', { name: /queue crm export/i }))

    expect(onClaim).toHaveBeenCalledWith(lead)
    expect(onGenerateAIReply).toHaveBeenCalledWith(lead)
    expect(onExportToCRM).toHaveBeenCalledWith(lead)
  })

  it('labels dismissal as acting on a source match', () => {
    const onDismiss = vi.fn()
    render(
      <BountyCard
        lead={lead}
        isPending={false}
        onClaim={vi.fn()}
        onGenerateAIReply={vi.fn()}
        onExportToCRM={vi.fn()}
        onDismiss={onDismiss}
      />,
    )

    const dismiss = screen.getByRole('button', { name: /dismiss source match/i })
    expect(dismiss).toHaveClass('min-h-11', 'min-w-11')
    expect(dismiss).not.toHaveClass('opacity-0', 'sm:opacity-0', 'group-hover:opacity-100')

    fireEvent.click(dismiss)

    expect(onDismiss).toHaveBeenCalledWith(lead.id)
  })
})
