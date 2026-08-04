import { getCurrentUser } from '@/lib/auth'
import { clampOnboardingStep } from '@/features/auth/onboarding'
import { redirect } from 'next/navigation'
import OnboardingForm from './OnboardingForm'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=%2Fonboarding')
  if (user.onboardingComplete) redirect('/app')

  return (
    <OnboardingForm
      initialDraft={{
        displayName: user.name ?? '',
        profileIconKey: (
          [
            'target',
            'star',
            'rocket',
            'lightning',
            'crystalBall',
            'shield',
            'crown',
            'fire',
            'sword',
            'robot',
          ] as const
        ).find((icon) => icon === user.profileIconKey) ?? 'target',
        businessDescription: user.businessDescription ?? '',
        targetCustomer: user.targetCustomer ?? '',
        firstKeyword: user.firstKeyword ?? '',
        preferredSource: user.preferredSource,
        onboardingStep: clampOnboardingStep(user.onboardingStep),
      }}
    />
  )
}
