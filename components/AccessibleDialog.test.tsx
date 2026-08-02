import { useRef, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AccessibleDialog from './AccessibleDialog'

function DialogHarness({ closeOnBackdrop = true }: { closeOnBackdrop?: boolean }) {
  const [open, setOpen] = useState(false)
  const preferredFocusRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
      <AccessibleDialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="test-dialog-title"
        describedBy="test-dialog-description"
        initialFocusRef={preferredFocusRef}
        closeOnBackdrop={closeOnBackdrop}
        panelClassName="dialog-panel"
      >
        <h2 id="test-dialog-title">Shared dialog</h2>
        <p id="test-dialog-description">Shared accessible behavior.</p>
        <button type="button">First action</button>
        <button ref={preferredFocusRef} type="button">Preferred action</button>
        <button type="button">Last action</button>
      </AccessibleDialog>
    </>
  )
}

describe('AccessibleDialog', () => {
  it('keeps closed dialog content out of the focus and accessibility trees', () => {
    render(
      <AccessibleDialog
        open={false}
        onClose={vi.fn()}
        labelledBy="hidden-title"
        describedBy="hidden-description"
        panelClassName="dialog-panel"
      >
        <h2 id="hidden-title">Hidden title</h2>
        <p id="hidden-description">Hidden description</p>
        <button type="button">Hidden action</button>
      </AccessibleDialog>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hidden action' })).not.toBeInTheDocument()
  })

  it('applies dialog semantics, initial focus, a focus trap, and body scroll containment', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))

    const dialog = screen.getByRole('dialog', { name: 'Shared dialog' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('Shared accessible behavior.')
    expect(screen.getByRole('button', { name: 'Preferred action' })).toHaveFocus()
    expect(document.body).toHaveStyle({ overflow: 'hidden' })
    expect(document.documentElement).toHaveStyle({ overflow: 'hidden' })
    expect(dialog).toHaveAttribute('data-dialog-scroll-container', 'true')
    expect(dialog).toHaveStyle({
      maxHeight: 'calc(100dvh - 2rem)',
      minHeight: '0',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
    })

    screen.getByRole('button', { name: 'Last action' }).focus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus()

    screen.getByRole('button', { name: 'First action' }).focus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Last action' })).toHaveFocus()
  })

  it('closes on Escape, restores the opener, and restores body scrolling', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    const opener = screen.getByRole('button', { name: 'Open dialog' })
    await user.click(opener)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('closes from the backdrop only when the consumer marks that action safe', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DialogHarness closeOnBackdrop={false} />)

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    await user.click(screen.getByRole('dialog').parentElement!)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    rerender(<DialogHarness closeOnBackdrop />)
    await user.click(screen.getByRole('dialog').parentElement!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
