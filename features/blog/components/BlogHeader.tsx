'use client'

import Link from 'next/link'
import { Zap, Gamepad2, Swords } from 'lucide-react'
import { sfx } from '@/lib/sfx'

export function BlogHeader() {
  return (
    <header className="sticky top-0 inset-x-0 z-50 w-full max-w-full border-b border-outline bg-canvas/95 backdrop-blur-md px-4 sm:px-8 py-3.5 pt-safe">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link
          href="/blog"
          onClick={() => sfx.playCoinDrop()}
          onMouseEnter={() => sfx.playHoverBlip()}
          className="flex items-center gap-2 font-semibold tracking-tight text-lg sm:text-xl text-ink hover:opacity-90 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline bg-forest text-accent">
            <Zap className="fill-accent stroke-[2.5px] w-5 h-5" />
          </div>
          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
            SEOLAQUEST <span className="rounded-xl border border-outline bg-card px-2 py-0.5 text-xs font-semibold">BLOG & KNOWLEDGE VAULT</span>
          </span>
        </Link>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Launch App */}
          <Link
            href="/app"
            onClick={() => sfx.playCoinDrop()}
            onMouseEnter={() => sfx.playHoverBlip()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-outline bg-card px-3.5 sm:px-4 py-2 text-xs font-semibold text-ink  hover:bg-highlight active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Gamepad2 size={16} strokeWidth={2.5} className="text-forest" />
            <span>🎮 LAUNCH APP</span>
          </Link>

          {/* Get Started */}
          <Link
            href="/sign-up"
            onClick={() => sfx.playCoinDrop()}
            onMouseEnter={() => sfx.playHoverBlip()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-outline bg-forest px-3.5 sm:px-4 py-2 text-xs font-semibold text-accent  hover:bg-forest hover:text-on-forest active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Swords size={16} strokeWidth={2.5} />
            <span>⚔️ GET STARTED</span>
          </Link>
        </div>

      </div>
    </header>
  )
}
