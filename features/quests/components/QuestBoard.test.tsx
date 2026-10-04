import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import QuestBoard from './QuestBoard'
import { claimQuestRewardAction } from '../actions'
import { sfx } from '@/lib/sfx'
import type { QuestBoardData } from '../server/board'

vi.mock('../actions', () => ({ claimQuestRewardAction: vi.fn() }))
const claim = vi.mocked(claimQuestRewardAction)
const board: QuestBoardData = {
  catalogEmpty: false,
  progression: { level: 1, xp: 0, xpRequired: 100, lifetimeXp: 0, reputation: 0, progressPercent: 0 },
  active: [], finished: [],
  claimable: [{ id: 'q1', code: 'review', title: 'Review your first signal', description: 'Review the source.', type: 'ONBOARDING', status: 'COMPLETED', completionAvailable: true, progress: 1, target: 1, progressPercent: 100, rewardXp: 25, expiresAt: null, claimedAt: null }],
}

beforeEach(() => vi.clearAllMocks())

describe('confirmed quest feedback', () => {
  it('waits for a new server-confirmed reward, blocks repeat clicks, and shows saved progress', async () => {
    let resolve!: (result: Awaited<ReturnType<typeof claimQuestRewardAction>>) => void
    claim.mockReturnValue(new Promise((done) => { resolve = done }))
    render(<QuestBoard board={board} />)
    fireEvent.click(screen.getByRole('button', { name: 'Claim reward' }))
    expect(sfx.playQuestComplete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Claiming…' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Claiming…' }))
    expect(claim).toHaveBeenCalledTimes(1)
    await act(async () => resolve({ ok: true, claimed: true, level: 1, lifetimeXp: 25 }))
    expect(sfx.playQuestComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('25 lifetime XP')
    expect(screen.getByRole('link', { name: /continue reviewing/i })).toHaveAttribute('href', '/app/leads')
  })

  it('uses the level-up cue instead of overlapping celebrations', async () => {
    claim.mockResolvedValue({ ok: true, claimed: true, level: 2, lifetimeXp: 125 })
    render(<QuestBoard board={board} />)
    fireEvent.click(screen.getByRole('button', { name: 'Claim reward' }))
    await waitFor(() => expect(sfx.playLevelUp).toHaveBeenCalledTimes(1))
    expect(sfx.playQuestComplete).not.toHaveBeenCalled()
  })

  it.each([{ ok: false, message: 'Not complete' }, { ok: true, claimed: false, message: 'Already claimed' }])('does not celebrate failed or duplicate claims: $message', async (result) => {
    claim.mockResolvedValue(result)
    render(<QuestBoard board={board} />)
    fireEvent.click(screen.getByRole('button', { name: 'Claim reward' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(result.message))
    expect(sfx.playQuestComplete).not.toHaveBeenCalled()
    expect(sfx.playLevelUp).not.toHaveBeenCalled()
  })

  it('recovers from a network rejection without trapping the claim button', async () => {
    claim.mockRejectedValue(new Error('offline'))
    render(<QuestBoard board={board} />)
    fireEvent.click(screen.getByRole('button', { name: 'Claim reward' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Could not confirm'))
    expect(screen.getByRole('button', { name: 'Claim reward' })).toBeEnabled()
    expect(sfx.playQuestComplete).not.toHaveBeenCalled()
  })
})
