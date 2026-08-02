'use server'

import { requireCurrentUser } from '@/lib/auth'
import { EntitlementService } from '@/src/modules/billing/application/EntitlementService'

type ActionResult = { ok: boolean; message?: string }

export async function addKeywordAction(phrase: string) {
  try {
    const { KeywordService } = await import('@/src/modules/keywords/application/KeywordService')
    const keyword = await KeywordService.addKeyword(phrase)
    return { ok: true, keyword }
  } catch (error: unknown) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not add keyword.' }
  }
}

export async function removeKeywordAction(keywordId: string) {
  try {
    const { KeywordService } = await import('@/src/modules/keywords/application/KeywordService')
    await KeywordService.removeKeyword(keywordId)
    return { ok: true }
  } catch (error: unknown) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not remove keyword.' }
  }
}

export async function claimQuestAction(leadId: string): Promise<ActionResult & { user?: { xp: number; level: number; xpRequired: number } }> {
  const { LeadService } = await import('@/src/modules/leads/application/LeadService')
  return LeadService.claimQuest(leadId)
}

export async function dismissLeadAction(leadId: string): Promise<ActionResult> {
  const { LeadService } = await import('@/src/modules/leads/application/LeadService')
  return LeadService.dismissLead(leadId)
}

export async function scanForLeadsAction(): Promise<ActionResult & { queued?: boolean; runId?: string }> {
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
}

export async function generateAIReplyAction(leadId: string): Promise<ActionResult & { reply?: string }> {
  const { LeadService } = await import('@/src/modules/leads/application/LeadService')
  return LeadService.generateAIReply(leadId)
}

export async function exportToCRMAction(leadId: string): Promise<ActionResult & { queued?: boolean; deliveryId?: string }> {
  const { LeadService } = await import('@/src/modules/leads/application/LeadService')
  return LeadService.exportToCRM(leadId)
}
