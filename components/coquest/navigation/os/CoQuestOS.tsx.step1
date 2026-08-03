'use client'

import NavigationRail from './rail/NavigationRail'

export default function CoQuestOS({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F5EF]">

      <NavigationRail />

      <section className="flex flex-1 flex-col">

        <header className="flex h-[72px] items-center justify-between border-b-4 border-black bg-white px-8">

          <div>

            <p className="text-xs font-black tracking-[0.25em] text-black/50">
              COQUEST
            </p>

            <h1 className="text-2xl font-black">
              Intelligence Engine
            </h1>

          </div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl border-2 border-black bg-[#FFD84D] px-4 py-2 font-bold">
              AI ONLINE
            </div>

          </div>

        </header>

        <main className="flex-1 overflow-auto p-10">
          {children}
        </main>

      </section>

    </div>
  )
}
