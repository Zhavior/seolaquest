import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MintKeyModal from './MintKeyModal'

describe('MintKeyModal', () => {
  it('renders no focusable content while closed and describes the unavailable state when open', () => {
    const { rerender } = render(<MintKeyModal isOpen={false} onClose={vi.fn()} onMint={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close key dialog' })).not.toBeInTheDocument()

    rerender(<MintKeyModal isOpen onClose={vi.fn()} onMint={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Key creation unavailable' })
    expect(dialog).toHaveAccessibleDescription(/no credential was created/i)
    const iconClose = screen.getByRole('button', { name: 'Close key dialog' })
    expect(iconClose).toHaveFocus()
    expect(iconClose).toHaveClass('h-11', 'w-11')
    expect(screen.getByRole('button', { name: /^Close$/ })).toHaveClass('min-h-11')
  })
})
