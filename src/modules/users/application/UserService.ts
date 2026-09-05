import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import {
  normalizeCrmWebhookUrl,
  UnsafeCrmWebhookUrlError,
} from '@/src/modules/core/security/crmWebhookUrl'

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export class UserService {
  static async businessContext(userId: string) {
    return prisma.user.findUnique({ where: { id: userId },
      select: { businessDescription: true, targetCustomer: true } })
  }

  static async completeOnboarding(name: string, title: string) {
    const user = await requireCurrentUser()
    const cleanName = cleanText(name, 60)
    const cleanTitle = cleanText(title, 60)
    if (!cleanName) return { ok: false, message: 'Add a display name to continue.' }

    await prisma.user.update({
      where: { id: user.id },
      data: { name: cleanName, title: cleanTitle || 'Lead Hunter', onboardingComplete: true },
    })
    revalidatePath('/app')
    return { ok: true }
  }

  static async updateSettings(input: { name: string; title: string; emailDigest: boolean; radarAlerts: boolean; crmWebhookUrl?: string }) {
    const user = await requireCurrentUser()
    const name = cleanText(input.name, 60)
    const title = cleanText(input.title, 60)
    if (!name) return { ok: false, message: 'Display name cannot be empty.' }

    let crmWebhookUrl: string | null | undefined
    try {
      crmWebhookUrl = input.crmWebhookUrl === undefined
        ? undefined
        : normalizeCrmWebhookUrl(input.crmWebhookUrl)
    } catch (error) {
      if (error instanceof UnsafeCrmWebhookUrlError) {
        return { ok: false, message: error.message }
      }
      throw error
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        title: title || 'Lead Hunter',
        emailDigest: input.emailDigest,
        radarAlerts: input.radarAlerts,
        ...(crmWebhookUrl !== undefined ? { crmWebhookUrl } : {}),
      },
    })
    revalidatePath('/app/settings')
    return { ok: true }
  }

}
