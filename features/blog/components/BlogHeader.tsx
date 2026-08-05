'use client'

import Link from 'next/link'
import { Zap, Gamepad2, Swords } from 'lucide-react'
import { sfx } from '@/lib/sfx'

export function BlogHeader() {
  return (
    <header className="sticky top-0 inset-x-0 z-50 w-full max-w-full border-b-4 border-black bg-[#FFE600] px-4 sm:px-8 py-3.5 shadow-[0_4px_0_0_#000] pt-safe">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link
          href="/blog"
          onClick={() => sfx.playCoinDrop()}
          onMouseEnter={() => sfx.playHoverBlip()}
          className="flex items-center gap-2 font-black uppercase tracking-tight text-lg sm:text-xl text-black hover:opacity-90 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center border-3 border-black bg-black text-[#FFE600] shadow-[2px_2px_0_0_#000]">
            <Zap className="fill-[#FFE600] stroke-[2.5px] w-5 h-5" />
          </div>
          <span className="flex items-center gap-1.5">
            COQUEST <span className="border-2 border-black bg-white px-2 py-0.5 text-xs font-black shadow-[2px_2px_0_0_#000] rotate-[-1deg]">BLOG & KNOWLEDGE VAULT</span>
          </span>
        </Link>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Launch App */}
          <Link
            href="/app"
            onClick={() => sfx.playCoinDrop()}
            onMouseEnter={() => sfx.playHoverBlip()}
            className="inline-flex items-center gap-1.5 border-3 border-black bg-white px-3.5 sm:px-4 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_0_#000] hover:bg-[#00FFFF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Gamepad2 size={16} strokeWidth={2.5} className="text-purple-600" />
            <span>🎮 LAUNCH APP</span>
          </Link>

          {/* Get Started */}
          <Link
            href="/sign-up"
            onClick={() => sfx.playCoinDrop()}
            onMouseEnter={() => sfx.playHoverBlip()}
            className="inline-flex items-center gap-1.5 border-3 border-black bg-black px-3.5 sm:px-4 py-2 text-xs font-black uppercase text-[#FFE600] shadow-[3px_3px_0_0_#000] hover:bg-[#8A2BE2] hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Swords size={16} strokeWidth={2.5} />
            <span>⚔️ GET STARTED</span>
          </Link>
        </div>

      </div>
    </header>
  )
}
