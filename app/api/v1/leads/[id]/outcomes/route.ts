import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { UnauthorizedError, ValidationError } from '@/src/modules/core/infrastructure/errors'
import { safeJson } from '@/src/modules/core/infrastructure/safeJson'
import { extractIdempotencyKey } from '@/src/modules/core/security/idempotency'
import { LeadOutcomeService } from '@/src/modules/leads/application/LeadOutcomeService'
import { LeadOutcomeInputSchema } from '@/src/modules/leads/domain/leadTransition'

type Context = { params: Promise<{ id: string }> }
export const GET = withApiHandler(async (_request, { params }: Context) => {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  const id = z.string().uuid().parse((await params).id)
  return NextResponse.json(await LeadOutcomeService.history(user.id, id))
})

export const POST = withApiHandler(async (request, { params }: Context) => {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  const leadId = z.string().uuid().parse((await params).id)
  const idempotencyKey = extractIdempotencyKey(request)
  if (!idempotencyKey) throw new ValidationError('Idempotency-Key is required')
  const input = LeadOutcomeInputSchema.parse(await safeJson(request))
  const result = await LeadOutcomeService.record({ userId: user.id, leadId, idempotencyKey, input })
  revalidatePath('/app')
  revalidatePath('/app/leads')
  return NextResponse.json({ outcome: {
    id: result.outcome.id, action: result.outcome.action, resultingStatus: result.outcome.resultingStatus,
    evidenceKind: result.outcome.evidenceKind, decisionId: result.outcome.decisionId,
    policyVersion: result.outcome.policyVersion, createdAt: result.outcome.createdAt,
  }, replayed: result.replayed })
})
