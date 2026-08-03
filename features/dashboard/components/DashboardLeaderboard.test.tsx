import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardLeaderboard } from './DashboardLeaderboard'

describe('DashboardLeaderboard', () => {
  it('explains why a cross-account leaderboard is empty and renders zero as zero', () => {
    render(
      <DashboardLeaderboard
        item={{}}
        dbLeaderboard={[]}
        dbAnalytics={[{ day: 'Mon', claimed: 0, dismissed: 0 }]}
      />,
    )

    expect(screen.getByText(/leaderboard unavailable/i)).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
