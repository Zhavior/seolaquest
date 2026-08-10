import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardStats } from './DashboardStats'
import type { DashboardLead, DashboardUser } from '@/features/dashboard/types'

const user: DashboardUser = {
  name: 'Hunter',
  title: 'Scout',
  xp: 400,
  level: 3,
  xpRequired: 1000,
  questsRemaining: 2,
  maxCredits: 10,
  planLabel: 'STARTER / active',
  entitlements: {
    canUsePaidScans: true,
    canGenerateAIReplies: false,
    canExportToCRM: false,
  },
}

const leads: DashboardLead[] = [
  {
    id: 'l1',
    platform: 'X',
    author: '@a',
    content: 'Looking for CRM with urgent budget',
    matched: 'CRM',
    url: 'https://x.com/1',
    sourceCreatedAt: null,
    aurora: null,
  },
]

describe('DashboardStats honesty', () => {
  it('does not invent ARR, regex intent %, or fake sync clocks', () => {
    render(
      <DashboardStats
        item={{}}
        user={user}
        characterTitle="Scout"
        isScanning={false}
        recentLevelUp={false}
        xpPercent={40}
        leads={leads}
        remainingQuests={2}
        maxCredits={10}
      />
    )

    expect(screen.queryByText(/projected arr/i)).toBeNull()
    expect(screen.queryByText(/last synced/i)).toBeNull()
    expect(screen.queryByText(/next auto-run/i)).toBeNull()
    expect(screen.queryByText(/\+100 xp/i)).toBeNull()
    expect(screen.getByRole('heading', { name: /providers & entitlements/i })).toBeVisible()
    expect(screen.getByRole('heading', { name: /hunter progression/i })).toBeVisible()
    expect(within(screen.getByTestId('telemetry-open-leads')).getByText('1')).toBeVisible()
    expect(within(screen.getByTestId('telemetry-live-aurora')).getByText('0')).toBeVisible()
    expect(within(screen.getByTestId('telemetry-scan-credits')).getByText('2/10')).toBeVisible()
  })

  it('counts only LIVE Aurora evaluations as scored', () => {
    const withLive: DashboardLead[] = [
      {
        ...leads[0],
        aurora: {
          score: 50,
          confidence: 0,
          recommendedAction: 'REVIEW',
          evaluationStatus: 'FALLBACK',
        },
      },
      {
        ...leads[0],
        id: 'l2',
        aurora: {
          score: 88,
          confidence: 0.9,
          recommendedAction: 'ENGAGE',
          evaluationStatus: 'LIVE',
        },
      },
    ]

    render(
      <DashboardStats
        item={{}}
        user={user}
        characterTitle="Scout"
        isScanning={false}
        recentLevelUp={false}
        xpPercent={40}
        leads={withLive}
        remainingQuests={2}
        maxCredits={10}
      />
    )

    expect(within(screen.getByTestId('telemetry-live-aurora')).getByText('1')).toBeVisible()
    expect(within(screen.getByTestId('telemetry-open-leads')).getByText('2')).toBeVisible()
  })
})
