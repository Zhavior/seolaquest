import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FeedbackScrollModal from './FeedbackScrollModal'

describe('FeedbackScrollModal', () => {
  it('has no hidden controls and truthfully describes the unavailable destination when open', () => {
    const props = { onClose: vi.fn(), onSuccessToast: vi.fn() }
    const { rerender } = render(<FeedbackScrollModal isOpen={false} {...props} />)

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()

    rerender(<FeedbackScrollModal isOpen {...props} />)
    const dialog = screen.getByRole('dialog', { name: 'Feedback submission unavailable' })
    expect(dialog).toHaveAccessibleDescription(/no feedback was sent/i)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })
})
