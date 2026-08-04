'use client'

import Header from './header/Header'
import NavigationRail from './rail/NavigationRail'

export default function CoQuestOS({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F5EF]">
      <NavigationRail />
      <section className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-6 md:p-10">
          {children}
        </main>
      </section>
    </div>
  )
}
