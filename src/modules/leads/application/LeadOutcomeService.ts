import 'server-only'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ConflictError, NotFoundError } from '@/src/modules/core/infrastructure/errors'
import { EventFactory } from '@/src/modules/core/events/EventFactory'
import { EventStore } from '@/src/modules/core/events/EventStore'
import { LeadOutcomeInputSchema, evaluateLeadTransition } from '../domain/leadTransition'
import { AuroraDecisionReader } from '@/src/modules/aurora/AuroraDecisionReader'

const commandSchema = z.object({
  userId: z.string().min(1).max(256),
  leadId: z.string().min(1).max(128),
  idempotencyKey: z.string().min(8).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  input: LeadOutcomeInputSchema,
}).strict()

export class LeadOutcomeService {
  static async record(command: z.infer<typeof commandSchema>) {
    const { userId, leadId, idempotencyKey, input } = commandSchema.parse(command)
    const fingerprint = createHash('sha256')
      .update(JSON.stringify({ actorId: userId, action: input.action, decisionId: input.decisionId ?? null, notes: input.notes ?? null })).digest('hex')

    return prisma.$transaction(async (tx) => {
      // Lock only this tenant's lead; concurrent commands serialize before checking their receipt.
      const owned = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Lead" WHERE "id" = ${leadId} AND "userId" = ${userId} FOR UPDATE
      `
      if (!owned.length) throw new NotFoundError('Lead not found')
      const previous = await tx.leadOutcome.findUnique({ where: { leadId_idempotencyKey: { leadId, idempotencyKey } } })
      if (previous) {
        if (previous.requestFingerprint !== fingerprint) throw new ConflictError('Idempotency key was used for a different command')
        return { outcome: previous, replayed: true }
      }
      const lead = await tx.lead.findUniqueOrThrow({ where: { id: leadId, userId } })
      const policy = evaluateLeadTransition(lead.status, input.action)
      const reader = new AuroraDecisionReader(tx.auroraDecision)
      const decision = input.decisionId ? await reader.findById(input.decisionId) : await reader.findLatestForOpportunity(leadId)
      if (input.decisionId && (!decision || decision.opportunityId !== leadId)) throw new NotFoundError('Decision not found for this lead')
      const now = new Date()
      await tx.lead.update({ where: { id: leadId, userId }, data: {
        status: policy.status,
        ...(input.action === 'CLAIM' ? { claimedAt: now } : {}),
        ...(input.action === 'CONTACT' ? { contactedAt: now } : {}),
        ...(input.action === 'DISMISS' ? { dismissedAt: now } : {}),
      } })
      const outcome = await tx.leadOutcome.create({ data: {
        leadId, actorId: userId, idempotencyKey, requestFingerprint: fingerprint,
        decisionId: decision?.id ?? null, action: input.action,
        previousStatus: lead.status, resultingStatus: policy.status,
        evidenceKind: policy.evidenceKind, policyVersion: policy.policyVersion,
        policyReasons: policy.reasons, notes: input.notes ?? null,
      } })
      // Claims retain their existing activity reward. Customer-reported sales never mint XP.
      if (input.action === 'CLAIM' || input.action === 'DISMISS') {
        const type = input.action === 'CLAIM' ? 'opportunity.engaged' : 'opportunity.dismissed'
        await EventStore.writeOutbox(EventFactory.create({
          type, version: 1, actorId: userId, source: 'LeadOutcomeService',
          correlationId: outcome.id, idempotencyKey: `${type}:${leadId}`,
          payload: input.action === 'CLAIM'
            ? { opportunityId: leadId, leadId, actionTaken: 'CLAIMED', engagedAt: now.toISOString() }
            : { opportunityId: leadId, leadId, dismissedAt: now.toISOString() },
        }), tx)
      }
      return { outcome, replayed: false }
    })
  }

  static async history(userId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId }, select: { id: true, status: true } })
    if (!lead) throw new NotFoundError('Lead not found')
    const outcomes = await prisma.leadOutcome.findMany({
      where: { leadId, lead: { userId } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100,
      select: { id: true, action: true, previousStatus: true, resultingStatus: true,
        evidenceKind: true, decisionId: true, policyVersion: true, policyReasons: true, notes: true, createdAt: true },
    })
    return { lead, outcomes, stateEvidence: outcomes.length ? 'RECORDED_TRANSITION' : 'NO_RECORDED_TRANSITION', limit: 100 }
  }
}
