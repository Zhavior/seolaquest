import { Sword } from 'lucide-react'
import { LandingNavClient } from './LandingNavClient'

export function LandingNav() {
  return (
    <nav aria-label="Landing navigation" className="fixed inset-x-0 top-0 z-50 border-b-4 border-black bg-[#f4ebd8]/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:h-20 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 -rotate-6 transform items-center justify-center border-3 border-black bg-[#ffd700] shadow-[3px_3px_0_0_rgba(0,0,0,1)] sm:h-10 sm:w-10 sm:border-4">
            <Sword aria-hidden="true" size={18} strokeWidth={3} className="text-black sm:h-5 sm:w-5" />
          </div>
          <div className="hidden flex-col min-[400px]:flex">
            <span className="text-xl sm:text-3xl font-black tracking-widest uppercase leading-none">CoQuest</span>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-700">by CoQuest</span>
          </div>
        </div>

        <LandingNavClient />
      </div>
    </nav>
  )
}
