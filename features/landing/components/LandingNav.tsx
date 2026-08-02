import React, { useState } from 'react'
import { Sword, Volume2, VolumeX } from 'lucide-react'
import { UserButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { sfx } from '@/lib/sfx'

export function LandingNav() {
  const { isLoaded, userId } = useAuth()
  const [sfxOn, setSfxOn] = useState(() => typeof window !== 'undefined' ? sfx.isEnabled() : true)

  const handleToggleSfx = () => {
    const newState = sfx.toggle()
    setSfxOn(newState)
  }

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

        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-4">
          <button
            type="button"
            onClick={handleToggleSfx}
            aria-label={sfxOn ? 'Turn sound effects off' : 'Turn sound effects on'}
            aria-pressed={sfxOn}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 border-2 border-black bg-[#fcf8f2] p-0 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:bg-[#ffd700] active:translate-x-0.5 active:translate-y-0.5 focus-visible:bg-[#ffd700] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:w-auto sm:border-3 sm:px-3"
          >
            {sfxOn ? <Volume2 aria-hidden="true" size={16} className="text-[#ff4500]" /> : <VolumeX aria-hidden="true" size={16} className="text-gray-500" />}
            <span className="hidden sm:inline">{sfxOn ? 'SFX: ON' : 'SFX: OFF'}</span>
          </button>

          {(!isLoaded || !userId) && (
            <>
              <Link
                href="/sign-in"
                onMouseEnter={() => sfx.playHoverBlip()}
                className="inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-bold uppercase tracking-wider underline-offset-4 decoration-4 hover:underline focus-visible:underline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:px-2 sm:text-sm"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => sfx.playCoinDrop()}
                onMouseEnter={() => sfx.playHoverBlip()}
                className="inline-flex min-h-11 shrink-0 items-center border-3 border-black bg-[#ff4500] px-2 py-1.5 text-center text-xs font-black uppercase leading-tight tracking-wide text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-1 active:translate-y-1 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:border-4 sm:px-6 sm:py-2 sm:text-base sm:tracking-wider sm:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
              >
                Create account
              </Link>
            </>
          )}
          {isLoaded && userId && (
            <>
              <Link
                href="/app"
                onClick={() => sfx.playCoinDrop()}
                className="inline-flex min-h-11 items-center border-3 border-black bg-[#ff4500] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all hover:translate-y-[2px] active:translate-x-1 active:translate-y-1 focus-visible:translate-y-[2px] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:border-4 sm:px-6 sm:py-2 sm:text-base"
              >
                Dashboard
              </Link>
              <div className="flex min-h-11 min-w-11 items-center justify-center [&_button]:min-h-11 [&_button]:min-w-11">
                <UserButton />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
