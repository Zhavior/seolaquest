/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuroraFeedbackService } from '../AuroraFeedbackService'
import prisma from '@/lib/prisma'
import { EventStore } from '@/src/modules/core/events/EventStore'

vi.mock('@/lib/prisma', () => {
  const transaction = vi.fn().mockImplementation(async (cb) => {
    return cb(prismaMock)
  })
  const prismaMock = {
    auroraDecision: { findUnique: vi.fn() },
    auroraFeedback: { create: vi.fn() },
    $transaction: transaction,
  }
  return { default: prismaMock }
})

vi.mock('@/src/modules/core/events/EventStore', () => ({
  EventStore: { writeOutbox: vi.fn() }
}))

describe('AuroraFeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('atomically persists feedback and outbox event', async () => {
    const mockDecision = {
      id: 'decision-123',
      sourceEventId: 'evt-123',
    }

    const mockFeedback = {
      id: 'fb-123',
      decisionId: 'decision-123',
      feedbackType: 'ENGAGED',
      source: 'admin',
      correction: { notes: 'Great lead' }
    }

    vi.mocked(prisma.auroraDecision.findUnique).mockResolvedValueOnce(mockDecision as any)
    vi.mocked(prisma.auroraFeedback.create).mockResolvedValueOnce(mockFeedback as any)

    const result = await AuroraFeedbackService.submitFeedback('admin-id', {
      decisionId: 'decision-123',
      feedbackType: 'ENGAGED',
      source: 'admin',
      correction: { notes: 'Great lead' }
    })

    expect(result.id).toBe('fb-123')
    expect(prisma.auroraDecision.findUnique).toHaveBeenCalledWith({ where: { id: 'decision-123' } })
    expect(prisma.auroraFeedback.create).toHaveBeenCalledWith({
      data: {
        decisionId: 'decision-123',
        feedbackType: 'ENGAGED',
        source: 'admin',
        correction: { notes: 'Great lead' }
      }
    })

    // Check outbox
    expect(EventStore.writeOutbox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'aurora.feedback.recorded',
        actorId: 'admin-id',
        correlationId: 'evt-123',
        payload: expect.objectContaining({
          feedbackId: 'fb-123',
          decisionId: 'decision-123'
        })
      }),
      expect.anything()
    )
  })

  it('rejects feedback for nonexistent decision', async () => {
    vi.mocked(prisma.auroraDecision.findUnique).mockResolvedValueOnce(null)

    await expect(AuroraFeedbackService.submitFeedback('admin-id', {
      decisionId: 'decision-123',
      feedbackType: 'ENGAGED',
      source: 'admin',
    })).rejects.toThrow('AuroraDecision not found')

    expect(prisma.auroraFeedback.create).not.toHaveBeenCalled()
    expect(EventStore.writeOutbox).not.toHaveBeenCalled()
  })

  it('rejects invalid feedback type via Zod schema', async () => {
    await expect(AuroraFeedbackService.submitFeedback('admin-id', {
      decisionId: 'decision-123',
      feedbackType: 'FAKE_TYPE' as any,
      source: 'admin',
    })).rejects.toThrow()
  })

  it('rejects oversized notes and arbitrary metadata via Zod schema', async () => {
    await expect(AuroraFeedbackService.submitFeedback('admin-id', {
      decisionId: 'decision-123',
      feedbackType: 'ENGAGED',
      source: 'admin',
      correction: {
        notes: 'A'.repeat(1001),
      }
    })).rejects.toThrow()

    await expect(AuroraFeedbackService.submitFeedback('admin-id', {
      decisionId: 'decision-123',
      feedbackType: 'ENGAGED',
      source: 'admin',
      correction: {
        unbounded_meta: true, // Should be rejected by .strict()
      } as any
    })).rejects.toThrow()
  })
})
