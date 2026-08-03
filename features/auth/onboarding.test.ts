import { describe, expect, it } from 'vitest'
import {
  clampOnboardingStep,
  cleanOnboardingText,
  onboardingStepSchema,
  skippableStepSchema,
} from './onboarding'

describe('onboarding input contract', () => {
  it('normalizes saved text and bounds resume steps', () => {
    expect(cleanOnboardingText('  local   service\n business  ', 60)).toBe('local service business')
    expect(clampOnboardingStep(-10)).toBe(1)
    expect(clampOnboardingStep(4)).toBe(4)
    expect(clampOnboardingStep(99)).toBe(6)
  })

  it('requires the fields that are unsafe to skip', () => {
    expect(onboardingStepSchema.safeParse({ step: 1, value: '' }).success).toBe(false)
    expect(onboardingStepSchema.safeParse({ step: 4, value: 'ab' }).success).toBe(false)
    expect(onboardingStepSchema.safeParse({ step: 5, value: 'UNSUPPORTED' }).success).toBe(false)
  })

  it('allows skip only for business and target-customer context', () => {
    expect(skippableStepSchema.safeParse(2).success).toBe(true)
    expect(skippableStepSchema.safeParse(3).success).toBe(true)
    expect(skippableStepSchema.safeParse(1).success).toBe(false)
    expect(skippableStepSchema.safeParse(4).success).toBe(false)
    expect(skippableStepSchema.safeParse(5).success).toBe(false)
  })
})
