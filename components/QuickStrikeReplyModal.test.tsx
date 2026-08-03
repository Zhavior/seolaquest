import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import QuickStrikeReplyModal from './QuickStrikeReplyModal'

const lead = {
  id: 'lead-1',
  platform: 'REDDIT',
  author: 'u/measured',
  content: 'Looking for a CRM',
  matched: 'CRM',
  url: 'https://reddit.com/example',
  sourceCreatedAt: null,
}

describe('QuickStrikeReplyModal', () => {
  it('makes clear that confirming does not send a reply', () => {
    const onConfirmClaim = vi.fn()
    render(
      <QuickStrikeReplyModal lead={lead} onClose={vi.fn()} onConfirmClaim={onConfirmClaim} />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Mark lead as contacted?' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveStyle({ maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' })
    expect(dialog).toHaveAccessibleDescription(/will not post, send, or dispatch a reply/i)
    expect(screen.getByRole('button', { name: 'Close confirmation' })).toHaveFocus()
    expect(screen.getByText(/will not post, send, or dispatch a reply/i)).toBeInTheDocument()
    expect(screen.queryByText(/fire reply|auto-reply|\+150 xp/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mark contacted' }))
    expect(onConfirmClaim).toHaveBeenCalledWith('lead-1')
  })
})
