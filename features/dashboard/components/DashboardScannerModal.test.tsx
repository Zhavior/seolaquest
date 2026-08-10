import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DashboardScannerModal } from './DashboardScannerModal'

describe('DashboardScannerModal', () => {
  it('labels queued scan status and renders controls', () => {
    render(
      <DashboardScannerModal
        setIsScannerModalOpen={vi.fn()}
        scanLogs={['Queued provider run']}
        scanStep={2}
        scanOutcome="pending"
      />
    )

    const dialog = screen.getByRole('dialog', { name: /scan status/i })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close scanner modal' })).toBeInTheDocument()
    expect(screen.getByText('Queued provider run')).toBeInTheDocument()
  })

  it('closes on Escape and focuses the close control on open', async () => {
    const user = userEvent.setup()
    const setOpen = vi.fn()

    render(
      <DashboardScannerModal
        setIsScannerModalOpen={setOpen}
        scanLogs={['Queued provider run']}
        scanStep={1}
        scanOutcome={null}
      />
    )

    expect(screen.getByRole('button', { name: 'Close scanner modal' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(setOpen).toHaveBeenCalledWith(false)
  })
})
