'use server'

import { requireCurrentUser } from '@/lib/auth'
import { EntitlementService } from '@/src/modules/billing/application/EntitlementService'
import { withServerAction } from '@/src/modules/core/infrastructure/server-action'
// Type-only: erased at compile time, so the runtime module stays behind the dynamic
// import below (and stays mockable by features/dashboard/actions.test.ts).
import type { KeywordService as KeywordServiceType } from '@/src/modules/keywords/application/KeywordService'

type ActionResult = { ok: boolean; message?: string }

type KeywordDto = Awaited<ReturnType<typeof KeywordServiceType.addKeyword>>

/**
 * The union — rather than a flat `{ ok; message?; keyword? }` — is the exact shape
 * TypeScript already inferred from the two `return` statements. Call sites narrow the
 * whole `result` const off `result.keyword` and then read `result.keyword.id` inside a
 * callback; only a union keeps that narrowing alive across the closure.
 */
type AddKeywordResult =
  | { ok: boolean; keyword: KeywordDto; message?: undefined }
  | { ok: boolean; keyword?: undefined; message: string }

/**
 * Deliberately carries no progression. Claiming emits `opportunity.engaged`; the
 * Gamify ledger scores it out of band and may decline it, so there is no XP
 * figure this action could return that would be true at the moment it returns.
 */
type ClaimQuestResult = ActionResult & {
  questsRemaining?: number
}

type ScanForLeadsResult = ActionResult & { queued?: boolean; runId?: string }

type GenerateAIReplyResult = ActionResult & { reply?: string }

type ExportToCRMResult = ActionResult & { queued?: boolean; deliveryId?: string }

export const addKeywordAction = withServerAction(
  {
    name: 'addKeywordAction',
    tier: 'global',
    onError: (failure): AddKeywordResult => ({ ok: false, message: failure.message }),
  },
  async (phrase: string): Promise<AddKeywordResult> => {
    try {
      const { KeywordService } = await import('@/src/modules/keywords/application/KeywordService')
      const keyword = await KeywordService.addKeyword(phrase)
      return { ok: true, keyword }
    } catch (error: unknown) {
      return { ok: false, message: error instanceof Error ? error.message : 'Could not add keyword.' }
    }
  },
)

export const removeKeywordAction = withServerAction(
  {
    name: 'removeKeywordAction',
    tier: 'global',
    onError: (failure): ActionResult => ({ ok: false, message: failure.message }),
  },
  async (keywordId: string): Promise<ActionResult> => {
    try {
      const { KeywordService } = await import('@/src/modules/keywords/application/KeywordService')
      await KeywordService.removeKeyword(keywordId)
      return { ok: true }
    } catch (error: unknown) {
      return { ok: false, message: error instanceof Error ? error.message : 'Could not remove keyword.' }
    }
  },
)

export const claimQuestAction = withServerAction(
  {
    name: 'claimQuestAction',
    tier: 'global',
    onError: (failure): ClaimQuestResult => ({ ok: false, message: failure.message }),
  },
  async (leadId: string): Promise<ClaimQuestResult> => {
    const { LeadService } = await import('@/src/modules/leads/application/LeadService')
    return LeadService.claimQuest(leadId)
  },
)

export const dismissLeadAction = withServerAction(
  {
    name: 'dismissLeadAction',
    tier: 'global',
    onError: (failure): ActionResult => ({ ok: false, message: failure.message }),
  },
  async (leadId: string): Promise<ActionResult> => {
    const { LeadService } = await import('@/src/modules/leads/application/LeadService')
    return LeadService.dismissLead(leadId)
  },
)

export const scanForLeadsAction = withServerAction(
  {
    name: 'scanForLeadsAction',
    // Provisions paid capacity: gated on `canUsePaidScans` and it spends a scan credit.
    tier: 'billing',
    onError: (failure): ScanForLeadsResult => ({ ok: false, message: failure.message }),
  },
  async (): Promise<ScanForLeadsResult> => {
    const user = await requireCurrentUser()
    const entitlements = await EntitlementService.forUser(user.id)
    if (!entitlements.canUsePaidScans) {
      return { ok: false, message: 'Manual scanning requires an active paid subscription.' }
    }

    const { ScanRunService } = await import('@/src/modules/leads/application/ScanRunService')
    const result = await ScanRunService.enqueueManual(user.id)
    if (!result.queued && 'reason' in result && result.reason === 'NO_ACTIVE_KEYWORDS') {
      return { ok: false, message: 'Add a keyword before scanning.' }
    }
    if (!result.queued && 'reason' in result && result.reason === 'NOT_ENTITLED') {
      return { ok: false, message: 'Manual scanning requires an active paid subscription.' }
    }
    if (!result.queued && 'reason' in result && result.reason === 'NO_CREDITS') {
      return { ok: false, message: 'No scan credits remaining.' }
    }
    return {
      ok: true,
      queued: true,
      runId: result.runId,
      message: result.queued ? 'Scan queued. Results will appear after processing.' : 'A scan is already queued for this window.',
    }
  },
)

export const generateAIReplyAction = withServerAction(
  {
    name: 'generateAIReplyAction',
    // Spends model tokens on every call, so it belongs on the AI bucket rather than the
    // 100/min ordinary-mutation bucket.
    tier: 'ai',
    onError: (failure): GenerateAIReplyResult => ({ ok: false, message: failure.message }),
  },
  async (leadId: string): Promise<GenerateAIReplyResult> => {
    const { LeadService } = await import('@/src/modules/leads/application/LeadService')
    return LeadService.generateAIReply(leadId)
  },
)

export const exportToCRMAction = withServerAction(
  {
    name: 'exportToCRMAction',
    tier: 'global',
    onError: (failure): ExportToCRMResult => ({ ok: false, message: failure.message }),
  },
  async (leadId: string): Promise<ExportToCRMResult> => {
    const { LeadService } = await import('@/src/modules/leads/application/LeadService')
    return LeadService.exportToCRM(leadId)
  },
)
