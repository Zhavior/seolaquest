'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { MAX_ACTIVE_KEYWORDS_PER_TENANT } from '@/src/modules/keywords/application/KeywordService'
import {
  cleanOnboardingText,
  keywordPhraseSchema,
  LAST_ONBOARDING_STEP,
  onboardingStepSchema,
  skippableStepSchema,
  type PreferredSource,
  type SaveOnboardingStepInput,
} from './onboarding'

type ActionCode = 'ALREADY_COMPLETE' | 'INVALID_STEP' | 'SIGNED_OUT' | 'VALIDATION_ERROR'

type ActionFailure = {
  ok: false
  code: ActionCode
  message: string
}

type SaveStepResult = ActionFailure | {
  ok: true
  nextStep: number
}

export type CompleteOnboardingResult = ActionFailure | {
  ok: true
  keyword: {
    id: string
    phrase: string
  }
}

function signedOutFailure(): ActionFailure {
  return {
    ok: false,
    code: 'SIGNED_OUT',
    message: 'Your session ended. Sign in again to resume your saved setup.',
  }
}

function alreadyCompleteFailure(): ActionFailure {
  return {
    ok: false,
    code: 'ALREADY_COMPLETE',
    message: 'Onboarding is already complete for this account.',
  }
}

function invalidStepFailure(): ActionFailure {
  return {
    ok: false,
    code: 'INVALID_STEP',
    message: 'Finish the current step before moving ahead.',
  }
}

function validationFailure(message: string): ActionFailure {
  return { ok: false, code: 'VALIDATION_ERROR', message }
}

function stepData(input: SaveOnboardingStepInput) {
  switch (input.step) {
    case 1:
      return { name: cleanOnboardingText(input.value, 60) }
    case 2:
      return { businessDescription: cleanOnboardingText(input.value, 500) }
    case 3:
      return { targetCustomer: cleanOnboardingText(input.value, 300) }
    case 4:
      return { firstKeyword: input.value }
    case 5:
      return { preferredSource: input.value }
  }
}

export async function saveOnboardingStepAction(input: SaveOnboardingStepInput): Promise<SaveStepResult> {
  const parsed = onboardingStepSchema.safeParse(input)
  if (!parsed.success) {
    return validationFailure(parsed.error.issues[0]?.message ?? 'Check this step and try again.')
  }

  try {
    const user = await getCurrentUser()
    if (!user) return signedOutFailure()
    if (user.onboardingComplete) return alreadyCompleteFailure()
    if (parsed.data.step > user.onboardingStep) return invalidStepFailure()

    const nextStep = Math.min(
      LAST_ONBOARDING_STEP,
      Math.max(user.onboardingStep, parsed.data.step + 1),
    )
    const updated = await prisma.user.updateMany({
      where: { id: user.id, onboardingComplete: false },
      data: {
        ...stepData(parsed.data),
        onboardingStep: nextStep,
      },
    })

    if (updated.count !== 1) return alreadyCompleteFailure()
    revalidatePath('/onboarding')
    return { ok: true, nextStep }
  } catch {
    return validationFailure('This step could not be saved. Your earlier progress is still safe; try again.')
  }
}

export async function skipOnboardingStepAction(step: 2 | 3): Promise<SaveStepResult> {
  const parsed = skippableStepSchema.safeParse(step)
  if (!parsed.success) return invalidStepFailure()

  try {
    const user = await getCurrentUser()
    if (!user) return signedOutFailure()
    if (user.onboardingComplete) return alreadyCompleteFailure()
    if (parsed.data > user.onboardingStep) return invalidStepFailure()

    const nextStep = Math.min(
      LAST_ONBOARDING_STEP,
      Math.max(user.onboardingStep, parsed.data + 1),
    )
    const data = parsed.data === 2
      ? { businessDescription: null, onboardingStep: nextStep }
      : { targetCustomer: null, onboardingStep: nextStep }
    const updated = await prisma.user.updateMany({
      where: { id: user.id, onboardingComplete: false },
      data,
    })

    if (updated.count !== 1) return alreadyCompleteFailure()
    revalidatePath('/onboarding')
    return { ok: true, nextStep }
  } catch {
    return validationFailure('This step could not be skipped. Your earlier progress is still safe; try again.')
  }
}

type LockedOnboardingUser = {
  onboardingComplete: boolean
  onboardingStep: number
  name: string | null
  businessDescription: string | null
  targetCustomer: string | null
  firstKeyword: string | null
  preferredSource: PreferredSource | null
}

export async function completeOnboardingAction(): Promise<CompleteOnboardingResult> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return signedOutFailure()
    if (currentUser.onboardingComplete) return alreadyCompleteFailure()

    const result = await prisma.$transaction(async (tx) => {
      const [user] = await tx.$queryRaw<LockedOnboardingUser[]>`
        SELECT
          "onboardingComplete",
          "onboardingStep",
          "name",
          "businessDescription",
          "targetCustomer",
          "firstKeyword",
          "preferredSource"
        FROM "User"
        WHERE "id" = ${currentUser.id}
        FOR UPDATE
      `

      if (!user) return signedOutFailure()
      if (user.onboardingComplete) return alreadyCompleteFailure()
      if (user.onboardingStep < LAST_ONBOARDING_STEP) return invalidStepFailure()

      const displayName = cleanOnboardingText(user.name ?? '', 60)
      const parsedPhrase = keywordPhraseSchema.safeParse(user.firstKeyword ?? '')
      if (!displayName) return validationFailure('Add a display name before completing setup.')
      if (!parsedPhrase.success) {
        return validationFailure(parsedPhrase.error.issues[0]?.message ?? 'Check your first keyword before completing setup.')
      }
      const phrase = parsedPhrase.data
      if (!user.preferredSource) return validationFailure('Choose a preferred source before completing setup.')

      let keyword = await tx.trackedKeyword.findFirst({
        where: {
          userId: currentUser.id,
          phrase: { equals: phrase, mode: 'insensitive' },
        },
        select: { id: true, phrase: true, active: true },
      })

      if (keyword) {
        if (!keyword.active) {
          const activeKeywordCount = await tx.trackedKeyword.count({
            where: { userId: currentUser.id, active: true },
          })
          if (activeKeywordCount >= MAX_ACTIVE_KEYWORDS_PER_TENANT) {
            return validationFailure(`This account already has ${MAX_ACTIVE_KEYWORDS_PER_TENANT} active keywords. Remove one before completing setup.`)
          }
        }
        keyword = await tx.trackedKeyword.update({
          where: { id: keyword.id },
          data: { active: true },
          select: { id: true, phrase: true, active: true },
        })
      } else {
        const activeKeywordCount = await tx.trackedKeyword.count({
          where: { userId: currentUser.id, active: true },
        })
        if (activeKeywordCount >= MAX_ACTIVE_KEYWORDS_PER_TENANT) {
          return validationFailure(`This account already has ${MAX_ACTIVE_KEYWORDS_PER_TENANT} active keywords. Remove one before completing setup.`)
        }
        keyword = await tx.trackedKeyword.create({
          data: { userId: currentUser.id, phrase },
          select: { id: true, phrase: true, active: true },
        })
      }

      await tx.tenantScanSchedule.upsert({
        where: { userId: currentUser.id },
        create: { userId: currentUser.id, enabled: false },
        update: { enabled: false },
      })
      await tx.user.update({
        where: { id: currentUser.id },
        data: {
          onboardingComplete: true,
          onboardingStep: LAST_ONBOARDING_STEP,
          firstKeyword: keyword.phrase,
        },
      })

      return { ok: true as const, keyword: { id: keyword.id, phrase: keyword.phrase } }
    })

    if (result.ok) {
      revalidatePath('/app')
      revalidatePath('/onboarding')
    }
    return result
  } catch {
    return validationFailure('Setup could not be completed. No scan or credit charge was started; try again.')
  }
}
