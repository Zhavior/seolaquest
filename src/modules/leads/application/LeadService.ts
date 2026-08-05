import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import { EntitlementService } from '@/src/modules/billing/application/EntitlementService'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { AiUsageLimiter } from '@/src/modules/core/security/AiUsageLimiter'
import {
  normalizeCrmWebhookUrl,
  UnsafeCrmWebhookUrlError,
} from '@/src/modules/core/security/crmWebhookUrl'
import {
  applyXpGain,
  XP_PER_CLAIMED_QUEST,
} from '@/src/modules/progression/domain/progression'
import { CrmDeliveryService } from './CrmDeliveryService'
import { z } from 'zod'

const openAiReplySchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().trim().min(1).max(2_000) }),
  })).min(1),
})

function levelAfterClaim(user: { xp: number; level: number; xpRequired: number }) {
  const { xp, level, xpRequired } = applyXpGain(user, XP_PER_CLAIMED_QUEST)
  return { xp, level, xpRequired }
}

export class LeadService {
  static async claimQuest(leadId: string) {
    const user = await requireCurrentUser()

    const claimedUser = await prisma.$transaction(async (tx) => {
      // Serialize progression per tenant. Without this row lock, two different
      // lead claims can both read the same XP and overwrite one earned reward.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`
      const dbUser = await tx.user.findUnique({ where: { id: user.id } })
      if (!dbUser) return null

      const claimed = await tx.lead.updateMany({
        where: { id: leadId, userId: user.id, status: 'NEW' },
        data: { status: 'CONTACTED', claimedAt: new Date(), contactedAt: new Date() },
      })
      if (claimed.count !== 1) return null

      const nextUser = levelAfterClaim({
        xp: dbUser.xp,
        level: dbUser.level,
        xpRequired: dbUser.xpRequired,
      })
      await tx.user.update({
        where: { id: user.id },
        data: nextUser,
      })
      return nextUser
    })

    if (!claimedUser) {
      return { ok: false, message: 'Quest no longer available or already claimed.' }
    }

    revalidatePath('/')
    return { ok: true, user: claimedUser }
  }

  static async dismissLead(leadId: string) {
    const user = await requireCurrentUser()
    const dismissed = await prisma.lead.updateMany({
      where: { id: leadId, userId: user.id, status: 'NEW' },
      data: { status: 'DISMISSED', dismissedAt: new Date() },
    })

    if (dismissed.count !== 1) {
      return { ok: false, message: 'Lead no longer available.' }
    }

    revalidatePath('/')
    return { ok: true }
  }

  static async generateAIReply(leadId: string) {
    const user = await requireCurrentUser()
    const entitlements = await EntitlementService.forUser(user.id)
    if (!entitlements.canGenerateAIReplies) {
      return { ok: false, message: 'AI replies require an active paid subscription.' }
    }

    const openAiApiKey = process.env.OPENAI_API_KEY?.trim()
    if (!openAiApiKey) {
      return { ok: false, message: 'AI replies are temporarily unavailable.' }
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return { ok: false, message: 'User not found.' }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId, userId: user.id },
      include: { keyword: true }
    })

    if (!lead) return { ok: false, message: 'Lead not found.' }

    const usage = await AiUsageLimiter.check(user.id)
    if (!usage.allowed) {
      return usage.reason === 'LIMITED'
        ? { ok: false, message: 'Daily AI reply limit reached. Try again after the limit resets.' }
        : { ok: false, message: 'AI replies are temporarily unavailable.' }
    }

    const prompt = `
      You are an expert sales assistant helping ${(dbUser.name || 'a founder').slice(0, 80)} pitch their product to a potential lead.
      The product solves problems related to: "${lead.keyword.phrase.slice(0, 120)}".
      The lead posted this on ${lead.platform}:
      "${lead.content.slice(0, 1_500)}"

      Write a short, friendly, and non-salesy reply (under 3 sentences) that adds value and subtly introduces how our product can help.
    `

    let generatedReply = ''
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiApiKey}`
        },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          model: process.env.OPENAI_REPLY_MODEL?.trim() || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 180,
        })
      })

      // Stays a bare Error: this method's own catch below converts it to
      // `{ ok: false, message }`, so it never reaches withApiHandler's error branch and
      // the taxonomy is never consulted. The status code an AppError carried would be dead
      // weight. Deliberately does not include the upstream body — that is logged, not returned.
      if (!response.ok) {
        throw new Error('OpenAI API request failed')
      }

      const data = openAiReplySchema.parse(await response.json())
      generatedReply = data.choices[0].message.content.trim()

      await prisma.user.update({
        where: { id: user.id },
        data: { spellsCast: { increment: 1 } }
      })

      return { ok: true, reply: generatedReply }

    } catch (error) {
      logger.error({ err: error, outcomeCode: 'AI_REPLY_GENERATION_FAILED' }, 'AI reply generation failed')
      return { ok: false, message: 'Failed to generate AI reply.' }
    }
  }

  static async exportToCRM(leadId: string) {
    const user = await requireCurrentUser()
    const entitlements = await EntitlementService.forUser(user.id)
    if (!entitlements.canExportToCRM) {
      return { ok: false, message: 'CRM export requires an active paid subscription.' }
    }

    if (!user.crmWebhookUrl) {
      return { ok: false, message: 'No CRM Webhook URL configured. Please add one in Settings.' }
    }

    let crmWebhookUrl: string
    try {
      const normalizedWebhookUrl = normalizeCrmWebhookUrl(user.crmWebhookUrl)
      if (!normalizedWebhookUrl) {
        return { ok: false, message: 'No CRM Webhook URL configured. Please add one in Settings.' }
      }
      crmWebhookUrl = normalizedWebhookUrl
    } catch (error) {
      if (error instanceof UnsafeCrmWebhookUrlError) {
        return { ok: false, message: 'Your CRM webhook URL is unsafe. Update it in Settings.' }
      }
      throw error
    }

    try {
      const queued = await CrmDeliveryService.enqueue({
        userId: user.id,
        leadId,
        normalizedDestination: crmWebhookUrl,
      })
      if (!queued.ok && queued.reason === 'NOT_FOUND') {
        return { ok: false, message: 'Lead not found.' }
      }
      if (!queued.ok && queued.reason === 'ALREADY_DELIVERED') {
        return { ok: false, message: 'This lead has already been exported to your CRM.' }
      }
      if (queued.ok && queued.status === 'DEAD') {
        return { ok: false, message: 'This CRM delivery exhausted its retries. Contact support before retrying.' }
      }
      return {
        ok: true,
        queued: true,
        deliveryId: queued.ok ? queued.deliveryId : undefined,
        message: queued.ok && queued.existing
          ? 'This lead is already queued for CRM delivery.'
          : 'Lead queued for CRM delivery.',
      }
    } catch (error: unknown) {
      logger.error({ err: error, outcomeCode: 'CRM_EXPORT_QUEUE_FAILED' }, 'CRM export queue failed')
      return { ok: false, message: 'Failed to queue lead for CRM delivery.' }
    }
  }
}
