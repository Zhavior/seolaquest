import { notFound } from 'next/navigation'
import OnboardingForm from '@/app/onboarding/OnboardingForm'

/**
 * Design preview for the tutorial quest, matching the existing `/dev/shell-v2`
 * pattern.
 *
 * The real `/onboarding` route is unreachable once an account completes setup,
 * which makes iterating on how the quest *feels* require resetting a real user
 * every time. This renders the same component against a fixed draft instead.
 *
 * The server actions the form calls still enforce their own auth, so nothing
 * here can write to an account. It is nonetheless gated out of production —
 * a design scratchpad has no business being routable on the live site.
 */
export default function OnboardingQuestPreview({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  if (process.env.NODE_ENV === 'production') notFound()

  return <PreviewBody searchParams={searchParams} />
}

async function PreviewBody({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const { step } = await searchParams
  const parsed = Number.parseInt(step ?? '1', 10)
  const onboardingStep = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 6) : 1

  return (
    <OnboardingForm
      initialDraft={{
        displayName: 'Signal Sage',
        profileIconKey: 'sword',
        businessDescription: 'Accessible websites for local service businesses.',
        targetCustomer: 'Plumbers and electricians without a booking page.',
        firstKeyword: 'can anyone recommend',
        preferredSource: 'X',
        onboardingStep,
      }}
    />
  )
}
