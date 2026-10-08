import { getAdminIdentity, OWNER_ADMIN_EMAIL } from '@/src/modules/admin/authorization'
import { ClerkProvider } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Suspense } from 'react'
import SEOlaQuestShell from '@/components/seolaquest/navigation/os-v2/SEOlaQuestShell'
import { ShellHudData } from '@/components/seolaquest/navigation/os-v2/statusbar/ShellHud'
import { IconSprite } from '@/features/handbook/artifact/IconSprite'
import { readGameMode } from '@/lib/gameMode.server'
import { GameModeProvider } from '@/components/seolaquest/GameModeContext'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=%2Fapp')
  // Not set up yet: the early-access page explains where GEO stands and offers
  // the X setup, instead of dropping the person straight into it.
  if (!user.onboardingComplete) redirect('/welcome')

  const admin = user.email?.trim().toLowerCase() === OWNER_ADMIN_EMAIL ? await getAdminIdentity() : null
  const gameMode = await readGameMode()

  // The HUD is built here, on the server, and passed down as an already-rendered
  // slot — so the account record never crosses into the client shell.
  return (
    <ClerkProvider>
      {/* The landing page's painted emblems, defined once and drawn by the
          rail, the top bar and the mobile tray with <use>. Rendered here on
          the server so the sprite stays out of the client bundle. */}
      <IconSprite />
      <GameModeProvider on={gameMode}>
        <SEOlaQuestShell isAdmin={Boolean(admin)} hud={<Suspense fallback={<span role="status" className="text-xs text-ink-muted">Loading account status…</span>}><ShellHudData user={user} gameMode={gameMode} /></Suspense>}>
          {children}
        </SEOlaQuestShell>
      </GameModeProvider>
    </ClerkProvider>
  )
}
