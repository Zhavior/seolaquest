import { render, screen } from '@testing-library/react'
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
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Battlestation live scan' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close scanner modal' })).toBeInTheDocument()
    expect(screen.getByText('Queued provider run')).toBeInTheDocument()
  })
})
