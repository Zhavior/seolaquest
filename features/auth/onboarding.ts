import { z } from 'zod'
import {
  DEFAULT_PROFILE_ICON_KEY,
  PROFILE_ICON_OPTIONS,
  type ProfileIconKey,
} from './profileIconOptions'

export const LAST_ONBOARDING_STEP = 6

export const preferredSources = ['REDDIT', 'X'] as const
export type PreferredSource = (typeof preferredSources)[number]

// Reddit is built but not released yet, so X is the only source a setup can pick.
// Existing REDDIT rows still validate; move REDDIT back into the selectable list to ship it.
export const selectablePreferredSources = ['X'] as const satisfies readonly PreferredSource[]
export const comingSoonPreferredSources = ['REDDIT'] as const satisfies readonly PreferredSource[]
export const DEFAULT_PREFERRED_SOURCE: PreferredSource = 'X'

export function isSelectablePreferredSource(value: PreferredSource | null): boolean {
  return value !== null && (selectablePreferredSources as readonly PreferredSource[]).includes(value)
}

const profileIconKeys = PROFILE_ICON_OPTIONS.map((option) => option.key) as [
  ProfileIconKey,
  ...ProfileIconKey[],
]

export const displayNameSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, ' ').trim())
  .pipe(
    z
      .string()
      .min(1, 'Add a display name to continue.')
      .max(60, 'Use 60 characters or fewer.'),
  )

export const profileIconKeySchema = z.enum(profileIconKeys)

export const onboardingIdentitySchema = z.object({
  displayName: displayNameSchema,
  profileIconKey: profileIconKeySchema.default(DEFAULT_PROFILE_ICON_KEY),
})

export type OnboardingDraft = {
  displayName: string
  profileIconKey: ProfileIconKey
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
    value: onboardingIdentitySchema,
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
