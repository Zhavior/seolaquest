'use client'

import { useUser } from '@clerk/nextjs'

export default function Header() {
  const { user } = useUser()
  const displayName = user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? 'Hunter'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="h-16 shrink-0 border-b-4 border-black bg-white">
      <div className="flex h-full items-center justify-between px-8">
        <h1 className="text-lg font-black tracking-[0.18em]">HYPEQUEST</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-neutral-600">{displayName}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-[#FFD84D] text-xs font-black">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
