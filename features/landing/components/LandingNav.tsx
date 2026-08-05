import { Sword } from 'lucide-react'
import { LandingNavClient } from './LandingNavClient'

export function LandingNav() {
  return (
    <nav
      aria-label="SEO la Quest navigation"
      className="fixed inset-x-0 top-0 z-50 border-b-4 border-outline bg-canvas/95 pt-[env(safe-area-inset-top)] backdrop-blur-md"
    >
      <div className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:h-20 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 -rotate-6 items-center justify-center border-[3px] border-outline bg-highlight-strong shadow-brutal-sm sm:h-11 sm:w-11 sm:border-4">
            <Sword aria-hidden="true" size={18} strokeWidth={3} className="text-on-accent sm:h-5 sm:w-5" />
          </div>

          <div className="hidden min-[400px]:flex flex-col">
            <span className="text-xl font-black uppercase leading-none tracking-[0.18em] text-ink sm:text-3xl">
              SEO LA QUEST
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-muted sm:text-[10px]">
              {'// REALM v1.0'}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 border-[3px] border-outline bg-card px-3 py-1.5 shadow-brutal-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00c951] motion-safe:animate-pulse motion-reduce:animate-none" />
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-ink">
              RADAR ONLINE
            </span>
          </div>
        </div>

        <LandingNavClient />
      </div>
    </nav>
  )
}
