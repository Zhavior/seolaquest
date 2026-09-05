import { z } from 'zod'
import { ConflictError } from '@/src/modules/core/infrastructure/errors'
import type { LeadStatus } from '@prisma/client'

export const LEAD_POLICY_VERSION = 'v1'
export const LeadActionSchema = z.enum(['CLAIM', 'DISMISS', 'CONTACT', 'REPLY', 'QUALIFY', 'CONVERT'])
export const LeadOutcomeInputSchema = z.object({
  action: LeadActionSchema,
  decisionId: z.string().uuid().optional(),
  notes: z.string().trim().max(1000).optional(),
}).strict()
export type LeadOutcomeInput = z.infer<typeof LeadOutcomeInputSchema>

const transitions: Record<LeadOutcomeInput['action'], { from: LeadStatus[]; to: LeadStatus }> = {
  CLAIM: { from: ['NEW', 'VIEWED'], to: 'CLAIMED' },
  DISMISS: { from: ['NEW', 'VIEWED', 'CLAIMED'], to: 'DISMISSED' },
  CONTACT: { from: ['NEW', 'VIEWED', 'CLAIMED'], to: 'CONTACTED' },
  REPLY: { from: ['CONTACTED'], to: 'REPLIED' },
  QUALIFY: { from: ['CONTACTED', 'REPLIED'], to: 'QUALIFIED' },
  CONVERT: { from: ['CONTACTED', 'REPLIED', 'QUALIFIED'], to: 'CONVERTED' },
}

export function evaluateLeadTransition(status: LeadStatus, action: LeadOutcomeInput['action']) {
  const rule = transitions[action]
  if (!rule.from.includes(status)) throw new ConflictError('This action is not allowed in the current lead state')
  return {
    status: rule.to,
    evidenceKind: action === 'CLAIM' || action === 'DISMISS' ? 'USER_ACTION' : 'CUSTOMER_REPORTED',
    policyVersion: LEAD_POLICY_VERSION,
    reasons: ['TENANT_OWNERSHIP_REQUIRED', 'VALID_STATE_TRANSITION', 'NO_AUTOMATIC_SALES_VERIFICATION'],
  }
}
