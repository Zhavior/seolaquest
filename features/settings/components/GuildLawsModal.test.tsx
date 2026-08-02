import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GuildLawsModal from './GuildLawsModal'

describe('GuildLawsModal', () => {
  it('keeps closed laws out of the DOM and exposes labelled terms when open', () => {
    const { rerender } = render(<GuildLawsModal isOpen={false} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<GuildLawsModal isOpen onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Guild Laws & Laws of Mana' })
    expect(dialog).toHaveAccessibleDescription('Official Guild Codex & Refund Directives')
    expect(screen.getByRole('button', { name: 'Close modal' })).toHaveFocus()
    expect(screen.getByText(/applicable consumer rights are not waived/i)).toBeInTheDocument()
  })
})
