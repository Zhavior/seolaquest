import type { ReactNode } from 'react'

import CommandHUD from './hud/CommandHUD'
import CommandPalette from './palette/CommandPalette'
import NavigationRail from './rail/NavigationRail'

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

export default function CoQuestOS({ user, children }: CoQuestOSProps) {
  return (
    <div className="min-h-screen bg-[#F4EFE6] text-black">
      <CommandPalette />

      <div className="flex min-h-screen">
        <NavigationRail />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-[288px]">
          <CommandHUD user={user} />

          <main className="min-w-0 flex-1 overflow-auto bg-[#F4EFE6]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
