import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReplyDraftPanel } from './ReplyDraftPanel'

const draft = { leadId: 'lead-1', author: '@buyer', url: 'https://x.com/buyer/status/1', text: 'Happy to help.' }

describe('ReplyDraftPanel', () => {
  it('keeps the draft editable and copies the edited text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<ReplyDraftPanel draft={draft} onClose={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Draft reply to @buyer' })).toHaveFocus()
    expect(screen.getByText(/Nothing is sent for you/)).toBeInTheDocument()
    const box = screen.getByRole('textbox', { name: 'Draft reply' })
    fireEvent.change(box, { target: { value: 'Happy to help, Sam.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Copy reply' }))

    expect(writeText).toHaveBeenCalledWith('Happy to help, Sam.')
    expect(await screen.findByText('Copied.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the post' })).toHaveAttribute('href', draft.url)
  })

  it('says how to copy by hand when the clipboard is blocked', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) } })
    const onClose = vi.fn()
    render(<ReplyDraftPanel draft={draft} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy reply' }))
    expect(await screen.findByText(/Select the text and copy it yourself/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })
})
