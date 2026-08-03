import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/coquest/shell/AppShell'
import { buildGuildHudData } from '@/components/coquest/hud/buildGuildHudData'
import { roomRouteMetaByPath } from '@/components/coquest/nav/room-route-meta'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=%2Fapp')
  if (!user.onboardingComplete) redirect('/onboarding?returnTo=%2Fapp')

  const hud = buildGuildHudData(user)
  const room = roomRouteMetaByPath['/app']

  if (room?.path === '/app/os-preview') {
    return children
  }

  return <AppShell hud={hud} room={room}>{children}</AppShell>
}
