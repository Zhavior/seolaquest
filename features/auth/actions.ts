'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { withServerAction } from '@/src/modules/core/infrastructure/server-action'
import { MAX_ACTIVE_KEYWORDS_PER_TENANT } from '@/src/modules/keywords/application/KeywordService'
import { buildSampleQuests } from '@/src/modules/onboarding/domain/sampleQuests'
import {
  applyXpGain,
  XP_FIRST_QUEST_BONUS,
} from '@/src/modules/progression/domain/progression'
import { DEFAULT_PROFILE_ICON_KEY } from './profileIconOptions'
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

export type OnboardingReward = {
  xpAwarded: number
  xp: number
  level: number
  xpRequired: number
  didLevelUp: boolean
  sampleQuestsSeeded: number
}

export type CompleteOnboardingResult = ActionFailure | {
  ok: true
  keyword: {
    id: string
    phrase: string
  }
  reward: OnboardingReward
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
      return {
        name: cleanOnboardingText(input.value.displayName, 60),
        profileIconKey: input.value.profileIconKey,
      }
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

/**
 * Tier `global`. This is an ordinary authenticated mutation of the caller's own onboarding
 * draft, and it is called once per step: a hunter clearing the six-step quest inside a minute
 * is the NORMAL path, so the 5/min `auth` tier would lock legitimate users out of setup
 * halfway through. Nothing here touches a credential, a session or a recovery flow.
 *
 * Reachable while signed out — the action answers a missing session with SIGNED_OUT rather
 * than throwing, because the UI renders that message and offers re-authentication. The
 * wrapper keys the bucket on `userId || ip`, so those callers are metered per IP, which is
 * what we want: an anonymous replay of the action id is capped without ever consuming an
 * authenticated user's budget.
 */
export const saveOnboardingStepAction = withServerAction(
  { name: 'saveOnboardingStepAction', tier: 'global' },
  async (input: SaveOnboardingStepInput): Promise<SaveStepResult> => {
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
    } catch (error) {
      // TRIPWIRE. This catch runs INSIDE the wrapper's handler, so it sees a thrown value
      // BEFORE `withServerAction`'s own `unstable_rethrow`. It is safe as written only
      // because nothing in this action redirects: verified that neither `getCurrentUser`
      // nor `revalidatePath` throws a Next.js control signal. If you ever add `redirect()`,
      // `permanentRedirect()` or `notFound()` above, `unstable_rethrow(error)` MUST become
      // the first statement here, or the navigation silently becomes an error message.
      logger.error(
        { err: error, step: parsed.data.step, outcomeCode: 'ONBOARDING_STEP_SAVE_FAILED' },
        'Onboarding step could not be saved',
      )
      return validationFailure('This step could not be saved. Your earlier progress is still safe; try again.')
    }
  },
)

/**
 * Tier `global`, for the same reasons as {@link saveOnboardingStepAction}: skipping an
 * optional context step is an ordinary authenticated mutation on the caller's own draft and
 * is interleaved with the save calls inside the same minute. Also reachable signed out, and
 * likewise metered per IP in that case.
 */
export const skipOnboardingStepAction = withServerAction(
  { name: 'skipOnboardingStepAction', tier: 'global' },
  async (step: 2 | 3): Promise<SaveStepResult> => {
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
    } catch (error) {
      // Same tripwire as saveOnboardingStepAction: no redirect below, so no rethrow needed
      // here yet. Adding one without `unstable_rethrow(error)` first breaks that navigation.
      logger.error(
        { err: error, step: parsed.data, outcomeCode: 'ONBOARDING_STEP_SKIP_FAILED' },
        'Onboarding step could not be skipped',
      )
      return validationFailure('This step could not be skipped. Your earlier progress is still safe; try again.')
    }
  },
)

type LockedOnboardingUser = {
  onboardingComplete: boolean
  onboardingStep: number
  name: string | null
  profileIconKey: string | null
  businessDescription: string | null
  targetCustomer: string | null
  firstKeyword: string | null
  preferredSource: PreferredSource | null
  xp: number
  level: number
  xpRequired: number
}

/**
 * Tier `billing`. This is the only place in the app that flips a tenant from "not paying us
 * anything" to "generating recurring outbound work": it activates a TrackedKeyword and turns
 * `tenantScanSchedule.enabled` on, and active keywords are capped per tenant precisely
 * because they draw down the metered provider request budget (see
 * MAX_ACTIVE_KEYWORDS_PER_TENANT in KeywordService). It also mints XP. That is provisioning
 * paid capacity, so it takes the moderate `billing` tier rather than `global`.
 *
 * 10/min never impedes the real flow — completion happens once per account and is idempotent
 * (the FOR UPDATE row lock plus the `onboardingComplete` guard make a second pass return
 * ALREADY_COMPLETE), so the budget exists purely to blunt replay of the action id.
 *
 * `auth` was rejected: nothing here touches a credential, a session, or account recovery.
 *
 * Reachable while signed out, answering with SIGNED_OUT before any database work. Those
 * callers key on IP, which is the desired metering for an unauthenticated replay.
 */
export const completeOnboardingAction = withServerAction(
  { name: 'completeOnboardingAction', tier: 'billing' },
  async (): Promise<CompleteOnboardingResult> => {
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
            "profileIconKey",
            "businessDescription",
            "targetCustomer",
            "firstKeyword",
            "preferredSource",
            "xp",
            "level",
            "xpRequired"
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
            data: {
              userId: currentUser.id,
              phrase,
            },
            select: { id: true, phrase: true, active: true },
          })
        }

        // Seeded tutorial signals, so the queue is never empty on the first visit.
        // `skipDuplicates` keeps this a no-op if a previous attempt already wrote
        // them — the ids are stable and the table is unique on (userId, externalPostId).
        const sampleQuests = buildSampleQuests(keyword.phrase)
        const seeded = await tx.lead.createMany({
          data: sampleQuests.map((quest) => ({
            userId: currentUser.id,
            keywordId: keyword.id,
            platform: quest.platform,
            externalPostId: quest.externalPostId,
            author: quest.author,
            content: quest.content,
            matched: quest.matched,
            url: quest.url,
          })),
          skipDuplicates: true,
        })

        // The first-quest reward. It rides the same row lock as the rest of
        // completion, so a double-submitted Complete button cannot pay it twice:
        // the second pass sees `onboardingComplete` and returns above.
        const reward = applyXpGain(
          { xp: user.xp, level: user.level, xpRequired: user.xpRequired },
          XP_FIRST_QUEST_BONUS,
        )

        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            onboardingComplete: true,
            onboardingStep: LAST_ONBOARDING_STEP,
            profileIconKey: user.profileIconKey ?? DEFAULT_PROFILE_ICON_KEY,
            xp: reward.xp,
            level: reward.level,
            xpRequired: reward.xpRequired,
            xpMultiplier: reward.xpMultiplier,
          },
        })

        await tx.tenantScanSchedule.upsert({
          where: { userId: currentUser.id },
          update: {
            enabled: true,
          },
          create: {
            userId: currentUser.id,
            enabled: true,
          },
        })

        return {
          ok: true as const,
          keyword: {
            id: keyword.id,
            phrase: keyword.phrase,
          },
          reward: {
            xpAwarded: XP_FIRST_QUEST_BONUS,
            xp: reward.xp,
            level: reward.level,
            xpRequired: reward.xpRequired,
            didLevelUp: reward.didLevelUp,
            sampleQuestsSeeded: seeded.count,
          },
        }
      })

      if (!result.ok) return result
      revalidatePath('/onboarding')
      revalidatePath('/app')
      return result
    } catch (error) {
      // Same tripwire. The caller navigates on the CLIENT (`router.push`) after reading the
      // resolved value, so this action deliberately does not redirect. If that ever moves
      // server-side, `unstable_rethrow(error)` must lead this block.
      logger.error(
        { err: error, outcomeCode: 'ONBOARDING_COMPLETE_FAILED' },
        'Onboarding completion transaction failed',
      )
      return validationFailure('Setup could not be completed right now. Your saved progress is still available.')
    }
  },
)
