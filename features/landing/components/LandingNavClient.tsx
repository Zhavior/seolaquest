'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'

export function LandingNavClient() {
  const { isLoaded, userId } = useAuth()

  return (
    <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-4">
      {isLoaded && userId ? (
        <>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-bold uppercase tracking-wider underline-offset-4 decoration-4 hover:underline focus-visible:underline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:px-2 sm:text-sm"
          >
            Dashboard
          </Link>
          <div className="min-h-11 min-w-11 flex items-center justify-center">
            <UserButton />
          </div>
        </>
      ) : (
        <>
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-bold uppercase tracking-wider underline-offset-4 decoration-4 hover:underline focus-visible:underline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:px-2 sm:text-sm"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex min-h-11 shrink-0 items-center border-3 border-black bg-[#ff4500] px-3 text-xs font-black uppercase tracking-wider text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all hover:bg-[#e03e00] active:translate-x-0.5 active:translate-y-0.5 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:px-4 sm:text-sm"
          >
            Start free
          </Link>
        </>
      )}
    </div>
  )
}
