import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TodaysMissionPanel } from './TodaysMissionPanel'
import type { TodaysMission } from '@/features/dashboard/lib/deriveMissionControl'

const baseMission: TodaysMission = {
  label: "Today's Mission",
  title: 'Run a scan for new matches',
  why: '1 active keyword and 3 scan credits are ready. Your open lead queue is empty.',
  tone: 'action',
  action: { kind: 'scan', ctaLabel: 'Start scan' },
  confidence: 'measured',
}

describe('TodaysMissionPanel', () => {
  it('exposes a single primary CTA and fires the scan handler', async () => {
    const user = userEvent.setup()
    const onScan = vi.fn()

    render(
      <TodaysMissionPanel
        item={{}}
        mission={baseMission}
        onScan={onScan}
        onReviewLeads={vi.fn()}
        onAddKeyword={vi.fn()}
        onClaimLead={vi.fn()}
        onViewScan={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { level: 2, name: /run a scan/i })).toBeVisible()
    const cta = screen.getByRole('button', { name: /start scan/i })
    expect(cta).toBeVisible()
    await user.click(cta)
    expect(onScan).toHaveBeenCalledTimes(1)
  })

  it('uses a link for billing actions', () => {
    render(
      <TodaysMissionPanel
        item={{}}
        mission={{
          ...baseMission,
          title: 'Scan credits are empty',
          action: { kind: 'open_billing', ctaLabel: 'Open billing' },
          tone: 'risk',
        }}
        onScan={vi.fn()}
        onReviewLeads={vi.fn()}
        onAddKeyword={vi.fn()}
        onClaimLead={vi.fn()}
        onViewScan={vi.fn()}
      />
    )

    expect(screen.getByRole('link', { name: /open billing/i })).toHaveAttribute('href', '/app/billing')
  })
})
