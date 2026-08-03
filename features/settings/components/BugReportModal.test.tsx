import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BugReportModal from './BugReportModal'

describe('BugReportModal', () => {
  it('has no hidden controls and truthfully describes the unavailable destination when open', () => {
    const props = { onClose: vi.fn(), onSuccessToast: vi.fn() }
    const { rerender } = render(<BugReportModal isOpen={false} {...props} />)

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()

    rerender(<BugReportModal isOpen {...props} />)
    const dialog = screen.getByRole('dialog', { name: 'Bug submission unavailable' })
    expect(dialog).toHaveAccessibleDescription(/no report was sent/i)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })
})
