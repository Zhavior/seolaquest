'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { sfx } from '@/lib/sfx'

// ---------------------------------------------------------------------------
// SFX toggle — shared across all nav states (logged in / out / loading)
// Defaults to true for SSR; corrects on first client render via useEffect to
// avoid hydration mismatch when the user has previously toggled it off.
// ---------------------------------------------------------------------------
function SfxToggle() {
  // Lazy initializer: reads localStorage on client only — no SSR mismatch because
  // sfx.isEnabled() returns `true` (the default) when window is undefined, which
  // matches the default value here.
  const [on, setOn] = useState(() =>
    typeof window !== 'undefined' ? sfx.isEnabled() : true,
  )

  return (
    <button
      type="button"
      aria-label={on ? 'Sound effects on — click to mute' : 'Sound effects off — click to enable'}
      title={on ? 'SFX: ON' : 'SFX: OFF'}
      onClick={() => {
        const next = sfx.toggle()
        setOn(next)
      }}
      className="hidden items-center gap-1.5 border-[3px] border-outline bg-card px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink shadow-brutal-sm transition-all duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none md:flex"
    >
      <span aria-hidden="true">{on ? '🔊' : '🔇'}</span>
      <span>SFX</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main client nav slice — auth-aware CTA buttons
// ---------------------------------------------------------------------------
export function LandingNavClient() {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) {
    return <div className="h-10 w-10 rounded-full border-[3px] border-outline bg-card shadow-brutal-sm motion-safe:animate-pulse motion-reduce:animate-none" />
  }

  if (userId) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <SfxToggle />

        <Link
          href="/app"
          className="hidden border-[3px] border-outline bg-accent px-3 py-2 font-black uppercase tracking-[0.14em] text-on-accent shadow-brutal-sm transition-all duration-75 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:inline-flex"
        >
          COMMAND CENTER
        </Link>

        <div className="relative pt-3">
          <div className="absolute -top-1 right-0 hidden border-2 border-outline bg-accent px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-on-accent shadow-brutal-sm sm:block">
            LVL 01
          </div>

          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[3px] border-outline bg-card shadow-brutal-sm sm:h-10 sm:w-10">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-full w-full',
                  userButtonAvatarBox: 'h-full w-full',
                },
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <SfxToggle />

      <Link
        href="/sign-in"
        className="inline-flex min-h-11 shrink-0 items-center px-2 text-xs font-bold uppercase tracking-wider underline-offset-4 decoration-4 hover:underline focus-visible:underline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-sm"
      >
        Sign in
      </Link>

      <Link
        href="/sign-up"
        className="inline-flex min-h-11 shrink-0 items-center border-[3px] border-outline bg-accent-2 px-3 py-2 font-black uppercase tracking-[0.14em] text-on-accent shadow-brutal-sm transition-all duration-75 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-4 sm:text-sm"
      >
        Start free
      </Link>
    </div>
  )
}
