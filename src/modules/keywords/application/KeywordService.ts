import 'server-only'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

import { UnauthorizedError, ValidationError } from '@/src/modules/core/infrastructure/errors'

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export const MAX_ACTIVE_KEYWORDS_PER_TENANT = 10

async function requireUserId() {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  return user.id
}

function getConfiguredPlatformLabel() {
  return process.env.TWITTER_BEARER_TOKEN ? 'Reddit & Twitter' : 'Reddit'
}

function toKeywordDto(keyword: {
  id: string
  phrase: string
  active: boolean
  _count: { leads: number }
}) {
  return {
    id: keyword.id,
    phrase: keyword.phrase,
    active: keyword.active,
    heroClass: 'Keyword monitor',
    platform: getConfiguredPlatformLabel(),
    status: keyword.active ? 'Active' : 'Paused',
    matchesFound: keyword._count.leads,
  }
}

export class KeywordService {
  static async listKeywords() {
    const userId = await requireUserId()
    const keywords = await prisma.trackedKeyword.findMany({
      where: { userId },
      select: {
        id: true,
        phrase: true,
        active: true,
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return keywords.map(toKeywordDto)
  }

  static async addKeyword(phrase: string) {
    const userId = await requireUserId()
    const cleanedPhrase = cleanText(phrase, 80)

    if (cleanedPhrase.length < 3) {
      throw new ValidationError('Use at least 3 characters for a keyword.')
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        // Serialize the product limit per tenant so concurrent additions cannot
        // overrun the provider request budget.
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`
        const activeKeywordCount = await tx.trackedKeyword.count({ where: { userId, active: true } })
        if (activeKeywordCount >= MAX_ACTIVE_KEYWORDS_PER_TENANT) {
          throw new ValidationError(`You can track up to ${MAX_ACTIVE_KEYWORDS_PER_TENANT} active keywords.`)
        }
        const keyword = await tx.trackedKeyword.create({
          data: { userId, phrase: cleanedPhrase },
          select: {
            id: true,
            phrase: true,
            active: true,
            _count: { select: { leads: true } },
          },
        })
        await tx.tenantScanSchedule.upsert({
          where: { userId },
          create: { userId, enabled: false },
          update: { enabled: false },
        })
        return keyword
      })
      revalidatePath('/app')
      return toKeywordDto(created)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ValidationError('That keyword is already being tracked.')
      }
      throw error
    }
  }

  static async removeKeyword(keywordId: string) {
    const userId = await requireUserId()
    const deleted = await prisma.$transaction(async (tx) => {
      const result = await tx.trackedKeyword.deleteMany({ where: { id: keywordId, userId } })
      if (!result.count) return result

      const remaining = await tx.trackedKeyword.count({ where: { userId, active: true } })
      if (remaining === 0) {
        await tx.tenantScanSchedule.updateMany({
          where: { userId, enabled: true },
          data: { enabled: false },
        })
      }
      return result
    })

    revalidatePath('/app')
    return { ok: true, alreadyAbsent: deleted.count === 0 }
  }
}
