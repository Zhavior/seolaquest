import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { toShellUser } from '@/lib/shellUser'
import CoQuestShell from '@/components/coquest/navigation/os-v2/CoQuestShell'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=%2Fapp')
  if (!user.onboardingComplete) redirect('/onboarding?returnTo=%2Fapp')

  return <CoQuestShell user={await toShellUser(user)}>{children}</CoQuestShell>
}
