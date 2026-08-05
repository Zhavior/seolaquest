import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { toShellUser } from '@/lib/shellUser'
import CoQuestShell from '@/components/coquest/navigation/os-v2/CoQuestShell'
import ShellHud from '@/components/coquest/navigation/os-v2/statusbar/ShellHud'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=%2Fapp')
  if (!user.onboardingComplete) redirect('/onboarding?returnTo=%2Fapp')

  // The HUD is built here, on the server, and passed down as an already-rendered
  // slot — so the account record never crosses into the client shell.
  return <CoQuestShell hud={<ShellHud user={await toShellUser(user)} />}>{children}</CoQuestShell>
}
