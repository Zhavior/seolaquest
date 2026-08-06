'use client'

import dynamic from 'next/dynamic'

const PixiWorldCanvas = dynamic(
  () => import('./PixiWorldCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center border-4 border-outline bg-canvas text-xs font-black uppercase tracking-[0.18em] text-ink shadow-brutal-lg">
        Loading Living HQ map...
      </div>
    ),
  },
)

export function GameCanvasWrapper() {
  return (
    <section className="border-4 border-outline bg-canvas p-4 shadow-brutal-lg">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-muted">
            Living HQ // Prototype
          </p>
          <h2 className="text-lg font-black uppercase text-ink">
            SEOlaQuest World Map
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 border-2 border-outline bg-[#22c55e]" />
          <span className="h-3 w-3 border-2 border-outline bg-[#facc15]" />
          <span className="h-3 w-3 border-2 border-outline bg-[#ef4444]" />
        </div>
      </header>

      <div className="min-h-[260px] w-full max-w-full overflow-hidden border-4 border-outline bg-[#111827]">
        <PixiWorldCanvas />
      </div>
    </section>
  )
}
