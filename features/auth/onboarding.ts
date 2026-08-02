import { z } from 'zod'

export const LAST_ONBOARDING_STEP = 6

export const preferredSources = ['REDDIT', 'X'] as const
export type PreferredSource = (typeof preferredSources)[number]

export type OnboardingDraft = {
  displayName: string
  businessDescription: string
  targetCustomer: string
  firstKeyword: string
  preferredSource: PreferredSource | null
  onboardingStep: number
}

export const keywordPhraseSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, ' ').trim())
  .pipe(
    z.string()
      .min(3, 'Use at least 3 characters for your keyword.')
      .max(80, 'Use 80 characters or fewer.'),
  )

export const onboardingStepSchema = z.discriminatedUnion('step', [
  z.object({
    step: z.literal(1),
    value: z.string().trim().min(1, 'Add a display name to continue.').max(60, 'Use 60 characters or fewer.'),
  }),
  z.object({
    step: z.literal(2),
    value: z.string().trim().min(1, 'Describe what your business or product does.').max(500, 'Use 500 characters or fewer.'),
  }),
  z.object({
    step: z.literal(3),
    value: z.string().trim().min(1, 'Describe the customer you want to find.').max(300, 'Use 300 characters or fewer.'),
  }),
  z.object({
    step: z.literal(4),
    value: keywordPhraseSchema,
  }),
  z.object({
    step: z.literal(5),
    value: z.enum(preferredSources),
  }),
])

export type SaveOnboardingStepInput = z.infer<typeof onboardingStepSchema>

export const skippableStepSchema = z.union([z.literal(2), z.literal(3)])

export function cleanOnboardingText(value: string, maxLength: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function clampOnboardingStep(step: number) {
  if (!Number.isInteger(step)) return 1
  return Math.min(LAST_ONBOARDING_STEP, Math.max(1, step))
}
