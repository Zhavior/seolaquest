import type { ReactNode } from 'react'

import NavigationRail from './rail/NavigationRail'

interface CoQuestOSProps {
  children: ReactNode
}

export default function CoQuestOS({ children }: CoQuestOSProps) {
  return (
    <div className="min-h-screen bg-[#F4EFE6] text-black">
      <div className="flex min-h-screen">
        <NavigationRail />
        <main className="min-w-0 flex-1 bg-[#F4EFE6]">
          {children}
        </main>
      </div>
    </div>
  )
}
