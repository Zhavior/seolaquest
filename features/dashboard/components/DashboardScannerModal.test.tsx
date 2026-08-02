import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DashboardScannerModal } from './DashboardScannerModal'

describe('DashboardScannerModal', () => {
  it('labels queued scan status and focuses its close control', () => {
    render(
      <DashboardScannerModal
        setIsScannerModalOpen={vi.fn()}
        scanLogs={['Queued provider run']}
        scanStep={2}
        scanOutcome="pending"
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'CoQuest Radar v2.4' })
    expect(dialog).toHaveStyle({ maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' })
    expect(dialog).toHaveAccessibleDescription('Scan status comes from the queued backend run.')
    expect(screen.getByRole('button', { name: 'Close scan status' })).toHaveFocus()
    expect(screen.getByText('Queued provider run')).toBeInTheDocument()
  })
})
