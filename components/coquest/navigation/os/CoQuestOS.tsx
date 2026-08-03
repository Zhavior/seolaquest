'use client'

import NavigationRail from './rail/NavigationRail'

export default function CoQuestOS({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full bg-[#F8F5EF]">
      <NavigationRail />

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
