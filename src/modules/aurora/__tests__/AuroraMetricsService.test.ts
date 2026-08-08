/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuroraMetricsService } from '../AuroraMetricsService'
import prisma from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  default: {
    auroraDecision: {
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    auroraFeedback: {
      groupBy: vi.fn(),
    }
  }
}))

describe('AuroraMetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates metrics correctly including explicit denominators', async () => {
    vi.mocked(prisma.auroraDecision.count).mockResolvedValue(100)

    // evaluationStatus
    vi.mocked(prisma.auroraDecision.groupBy).mockResolvedValueOnce([
      { evaluationStatus: 'LIVE', _count: 80 } as any,
      { evaluationStatus: 'FALLBACK', _count: 20 } as any,
    ])
    // recommendedAction
    vi.mocked(prisma.auroraDecision.groupBy).mockResolvedValueOnce([
      { recommendedAction: 'IGNORE', _count: 60 } as any,
      { recommendedAction: 'ENGAGE', _count: 40 } as any,
    ])
    // priority
    vi.mocked(prisma.auroraDecision.groupBy).mockResolvedValueOnce([
      { priority: 'LOW', _count: 90 } as any,
      { priority: 'HIGH', _count: 10 } as any,
    ])
    // averages
    vi.mocked(prisma.auroraDecision.aggregate).mockResolvedValueOnce({
      _avg: { finalScore: 50, confidence: 85 }
    } as any)

    // Mock the rest of the groupBy calls to return empty to satisfy Promise.all
    for (let i = 0; i < 6; i++) {
      vi.mocked(prisma.auroraDecision.groupBy).mockResolvedValueOnce([])
    }

    vi.mocked(prisma.auroraFeedback.groupBy).mockResolvedValueOnce([
      { feedbackType: 'ENGAGED', _count: 5 } as any,
      { feedbackType: 'DISMISSED', _count: 15 } as any,
    ])

    const metrics = await AuroraMetricsService.getOverviewMetrics()

    expect(metrics.totalDecisions).toBe(100)
    expect(metrics.averageScore).toBe(50)

    // Explicit denominator for decisions
    const liveStatus = metrics.evaluationStatus.find(s => s.label === 'LIVE')
    expect(liveStatus?.rate).toBe(0.8) // 80 / 100

    // Explicit denominator for feedback
    const dismissedFeedback = metrics.feedbackDistribution.find(f => f.label === 'DISMISSED')
    expect(dismissedFeedback?.rate).toBe(0.75) // 15 / 20 total feedback
  })

  it('handles zero records gracefully without NaN rates', async () => {
    vi.mocked(prisma.auroraDecision.count).mockResolvedValue(0)

    vi.mocked(prisma.auroraDecision.groupBy).mockResolvedValue([])
    vi.mocked(prisma.auroraDecision.aggregate).mockResolvedValue({ _avg: { finalScore: null, confidence: null } } as any)
    vi.mocked(prisma.auroraFeedback.groupBy).mockResolvedValue([])

    const metrics = await AuroraMetricsService.getOverviewMetrics()

    expect(metrics.totalDecisions).toBe(0)
    expect(metrics.averageScore).toBe(0)
    expect(metrics.evaluationStatus.length).toBe(0)
    expect(metrics.feedbackDistribution.length).toBe(0)
  })

  it('bounds recent decisions query', async () => {
    vi.mocked(prisma.auroraDecision.findMany).mockResolvedValue([])

    await AuroraMetricsService.getRecentDecisions(15)

    expect(prisma.auroraDecision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 15, orderBy: { createdAt: 'desc' } })
    )
  })
})
