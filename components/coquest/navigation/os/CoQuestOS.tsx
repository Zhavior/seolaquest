'use client'

import type { ReactNode } from 'react'

import CommandHUD from './hud/CommandHUD'
import CommandPalette from './palette/CommandPalette'
import NavigationRail from './rail/NavigationRail'
import { LayoutProvider } from './layout/LayoutContext'

interface UserSummary {
  name: string | null
  title: string | null
  level: number
  xp: number
  xpRequired: number
  questsRemaining: number
  spellsCast: number
  questsExported: number
  maxCredits: number
  profileIconKey: string | null
}

interface CoQuestOSProps {
  user: UserSummary
  children: ReactNode
}

function Shell({ user, children }: CoQuestOSProps) {

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-black">
      <CommandPalette />

      <NavigationRail />

      <div className="min-h-screen">
        <CommandHUD user={user} />

        <main className="min-h-[calc(100vh-80px)] overflow-auto bg-[#F4EFE6]">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function CoQuestOS(props: CoQuestOSProps) {
  return (
    <LayoutProvider>
      <Shell {...props} />
    </LayoutProvider>
  )
}
