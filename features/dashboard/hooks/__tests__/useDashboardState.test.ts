import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDashboardState } from '../useDashboardState'
import { DashboardUser, DashboardLead, AnalyticsData } from '../../types'

const actionMocks = vi.hoisted(() => ({
  addKeywordAction: vi.fn(),
  removeKeywordAction: vi.fn(),
  claimQuestAction: vi.fn(),
  dismissLeadAction: vi.fn(),
  scanForLeadsAction: vi.fn(),
  generateAIReplyAction: vi.fn(),
  exportToCRMAction: vi.fn(),
}))

vi.mock('../../actions', () => actionMocks)

vi.mock('@/lib/sfx', () => ({
  sfx: {
    playCoinDrop: vi.fn(),
    playHit: vi.fn(),
    playBountyUnlock: vi.fn(),
    playSwordSlash: vi.fn(),
    playElixirDrink: vi.fn(),
    playHoverBlip: vi.fn(),
  },
}))

const keywordDto = { id: 'database-keyword-id', phrase: 'CRM', active: true }

function resetActionMocks() {
  actionMocks.addKeywordAction.mockResolvedValue({ ok: true, keyword: keywordDto })
  actionMocks.removeKeywordAction.mockResolvedValue({ ok: true })
  actionMocks.claimQuestAction.mockResolvedValue({ ok: true, user: { xp: 1400, level: 4, xpRequired: 2000 } })
  actionMocks.dismissLeadAction.mockResolvedValue({ ok: true })
  actionMocks.scanForLeadsAction.mockResolvedValue({
    ok: true,
    queued: true,
    runId: 'scan-run-1',
    message: 'Scan queued. Results will appear after processing.',
  })
  actionMocks.generateAIReplyAction.mockResolvedValue({ ok: true, reply: 'AI response text' })
  actionMocks.exportToCRMAction.mockResolvedValue({ ok: true, message: 'Exported' })
}

const mockUser: DashboardUser = {
  name: 'Test Hunter',
  title: 'Knight Slasher',
  xp: 1250,
  level: 4,
  xpRequired: 2000,
}

const mockLeads: DashboardLead[] = [
  {
    id: 'lead-1',
    platform: 'REDDIT',
    author: 'u/test_user',
    content: 'Looking for alternative to Mention',
    matched: 'Mention alternative',
    url: 'https://reddit.com/r/saas/1',
    sourceCreatedAt: new Date().toISOString(),
  },
  {
    id: 'lead-2',
    platform: 'TWITTER',
    author: '@test_twitter',
    content: 'Need a SaaS developer',
    matched: 'need developer',
    url: 'https://x.com/status/2',
    sourceCreatedAt: new Date().toISOString(),
  },
]

const mockAnalytics: AnalyticsData = [
  { day: 'Mon', claimed: 4, dismissed: 1 },
  { day: 'Tue', claimed: 8, dismissed: 2 },
]

describe('useDashboardState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetActionMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      scan: {
        status: 'SUCCEEDED',
        counts: { leadsCreated: 2 },
        refunded: false,
        balance: 49,
        provider: { status: 'AVAILABLE' },
      },
    }), { status: 200 })))
  })

  it('initializes with provided user and leads', () => {
    const { result } = renderHook(() =>
      useDashboardState({
        dbUser: mockUser,
        dbKeywords: [{ id: 'k1', phrase: 'CRM', active: true }],
        dbLeads: mockLeads,
        dbAnalytics: mockAnalytics,
        dbLeaderboard: [],
      })
    )

    expect(result.current.user.name).toBe('Test Hunter')
    expect(result.current.leads).toHaveLength(2)
    expect(result.current.filter).toBe('ALL')
    expect(result.current.asyncStatus).toBe('idle')
  })

  it('filters leads by platform', () => {
    const { result } = renderHook(() =>
      useDashboardState({
        dbUser: mockUser,
        dbKeywords: [],
        dbLeads: mockLeads,
        dbAnalytics: mockAnalytics,
        dbLeaderboard: [],
      })
    )

    expect(result.current.filteredLeads).toHaveLength(2)
  })

  it('keeps an empty tenant dashboard empty', () => {
    const { result } = renderHook(() =>
      useDashboardState({
        dbUser: mockUser,
        dbKeywords: [],
        dbLeads: [],
        dbAnalytics: [],
        dbLeaderboard: [],
      })
    )

    expect(result.current.leads).toEqual([])
    expect(result.current.remainingQuests).toBe(0)
    expect(result.current.subscriptionTier).toBe('PLAN UNAVAILABLE')
  })

  it('handles bounty claiming and updates XP', async () => {
    const { result } = renderHook(() =>
      useDashboardState({
        dbUser: mockUser,
        dbKeywords: [],
        dbLeads: mockLeads,
        dbAnalytics: mockAnalytics,
        dbLeaderboard: [],
      })
    )

    await act(async () => {
      result.current.handleConfirmQuickStrikeClaim('lead-1')
    })

    expect(result.current.claimedCount).toBe(1)
    expect(result.current.user.xp).toBe(1400)
    expect(result.current.notice).toBe('Quest claimed.')
  })

  it('uses the persisted keyword ID so a new keyword can be deleted immediately', async () => {
    const { result } = renderHook(() =>
      useDashboardState({
        dbUser: mockUser,
        dbKeywords: [],
        dbLeads: [],
        dbAnalytics: [],
        dbLeaderboard: [],
      })
    )

    act(() => result.current.setNewKeyword('CRM'))
    await act(async () => result.current.addKeyword())

    expect(result.current.keywords).toEqual([keywordDto])
    await act(async () => result.current.removeKeyword('database-keyword-id'))
    expect(actionMocks.removeKeywordAction).toHaveBeenCalledWith('database-keyword-id')
    expect(result.current.keywords).toEqual([])
  })

  it('reports only the server-confirmed scanner outcome', async () => {
    const { result } = renderHook(() =>
      useDashboardState({
        dbUser: mockUser,
        dbKeywords: [],
        dbLeads: mockLeads,
        dbAnalytics: mockAnalytics,
        dbLeaderboard: [],
      })
    )

    await act(async () => {
      result.current.runMockScanner()
    })

    expect(result.current.asyncStatus).toBe('idle')
    expect(result.current.isScannerModalOpen).toBe(true)
    expect(result.current.scanLogs).toEqual([
      'Preparing durable scan request...',
      'Saving query state...',
      'Queueing provider work...',
      'Scan queued with durable run scan-run-1.',
      'Server status: SUCCEEDED',
      'Scan completed: 2 new source matches; provider status AVAILABLE.',
    ])
    expect(result.current.scanOutcome).toBe('succeeded')
    expect(result.current.remainingQuests).toBe(49)
  })
})
