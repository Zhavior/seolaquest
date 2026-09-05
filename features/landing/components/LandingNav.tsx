import Link from 'next/link'
import { Sword } from 'lucide-react'
import { LandingNavClient } from './LandingNavClient'

export function LandingNav() {
  return (
    <nav
      aria-label="SEOlaQuest navigation"
      className="fixed inset-x-0 top-0 z-50 border-b border-outline bg-canvas/95 pt-[env(safe-area-inset-top)] backdrop-blur-md"
    >
      <div className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:h-20 sm:gap-6 sm:px-6">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[20px] border border-outline bg-accent sm:h-11 sm:w-11 sm:border">
            <Sword aria-hidden="true" size={18} strokeWidth={3} className="text-on-accent sm:h-5 sm:w-5" />
          </div>

      <div className="hidden min-[400px]:flex flex-col">
            <span className="text-xl font-display font-medium leading-none text-ink sm:text-3xl">
              SEOlaQuest
            </span>
            <span className="font-sans text-[9px] text-ink-muted sm:text-[10px]">
              Customer research on X
            </span>
          </div>
        </div>

      <div className="hidden items-center gap-5 lg:flex">
          <Link href="/#how-it-works" className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline">How it works</Link>
          <Link href="/pricing" className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline">Pricing</Link>
        </div>

        <LandingNavClient />
      </div>
    </nav>
  )
}
