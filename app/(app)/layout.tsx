import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import CoQuestOS from '@/components/coquest/navigation/os/CoQuestOS'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=%2Fapp')
  if (!user.onboardingComplete) redirect('/onboarding?returnTo=%2Fapp')

  return <CoQuestOS>{children}</CoQuestOS>
}
