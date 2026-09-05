import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { AppError } from '@/src/modules/core/infrastructure/errors'
import { EventStore } from '@/src/modules/core/events/EventStore'
import { EventFactory } from '@/src/modules/core/events/EventFactory'

export const FeedbackTypeSchema = z.enum([
  'DISMISSED',
  'SAVED',
  'ENGAGED',
  'REPLIED',
  'QUALIFIED',
  'CONVERTED',
  'MANUAL_OVERRIDE'
])

export const SubmitFeedbackSchema = z.object({
  decisionId: z.string().min(1).max(128),
  feedbackType: FeedbackTypeSchema,
  source: z.string().min(1).max(120),
  correction: z.object({
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters.').optional(),
    expectedAction: z.enum(['IGNORE', 'WATCH', 'ENGAGE']).optional(),
    expectedPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  }).strict().nullable().optional(),
})

export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>

export class AuroraFeedbackService {
  /**
   * Captures human feedback for an AuroraDecision and atomically persists
   * an `aurora.feedback.recorded` event. The canonical decision remains unchanged.
   */
  static async submitFeedback(actorId: string, input: SubmitFeedbackInput) {
    const { decisionId, feedbackType, source, correction } = SubmitFeedbackSchema.parse(input)

    return await prisma.$transaction(async (tx) => {
      // 1. Verify decision exists
      const decision = await tx.auroraDecision.findUnique({
        where: { id: decisionId },
      })
      if (!decision) {
        throw new AppError('AuroraDecision not found', 404, 'NOT_FOUND')
      }

      // 2. Persist feedback (immutable, server-authoritative)
      const feedback = await tx.auroraFeedback.create({
        data: {
          decisionId,
          feedbackType,
          source,
          correction: correction ? (correction as Prisma.InputJsonValue) : Prisma.DbNull,
        }
      })

      // 3. Emit event atomically
      const event = EventFactory.create({
        type: 'aurora.feedback.recorded',
        version: 1,
        actorId,
        source: 'AuroraFeedbackService',
        correlationId: decision.sourceEventId,
        idempotencyKey: `aurora.feedback.recorded:${feedback.id}`,
        payload: {
          feedbackId: feedback.id,
          decisionId: decision.id,
          feedbackType: feedback.feedbackType,
          source: feedback.source,
          correction: feedback.correction ?? null,
        },
      })

      await EventStore.writeOutbox(
        event,
        tx
      )

      return feedback
    })
  }
}
