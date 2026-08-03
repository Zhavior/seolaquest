'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'

export function LandingNavClient() {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) {
    return <div className="h-10 w-10 rounded-full border-[3px] border-black bg-white shadow-[3px_3px_0_0_#000] motion-safe:animate-pulse" />
  }

  if (userId) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/dashboard"
          className="hidden border-[3px] border-black bg-[#FFE600] px-3 py-2 font-black uppercase tracking-[0.14em] text-black shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:inline-flex"
        >
          COMMAND CENTER
        </Link>

        <div className="relative pt-3">
          <div className="absolute -top-1 right-0 hidden border-2 border-black bg-[#FFE600] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_0_#000] sm:block">
            LVL 01
          </div>

          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[3px] border-black bg-white shadow-[3px_3px_0_0_#000] sm:h-10 sm:w-10">
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
      <Link
        href="/sign-in"
        className="inline-flex min-h-11 shrink-0 items-center px-2 text-xs font-bold uppercase tracking-wider underline-offset-4 decoration-4 hover:underline focus-visible:underline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-sm"
      >
        Sign in
      </Link>

      <Link
        href="/sign-up"
        className="inline-flex min-h-11 shrink-0 items-center border-[3px] border-black bg-[#ff5a36] px-3 py-2 font-black uppercase tracking-[0.14em] text-black shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-4 sm:text-sm"
      >
        Start free
      </Link>
    </div>
  )
}
