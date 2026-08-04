'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import { SignOutButton, useUser } from '@clerk/nextjs'

import RailLogo from './RailLogo'
import { navigation } from '../shared/navigation'

export default function NavigationRail() {
  const pathname = usePathname()
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const railInner = (
    <div className="flex h-full flex-col border-r-2 border-black bg-[#FFF8D6]">
      <div className="border-b-2 border-black p-3">
        <div className="flex items-center gap-3 rounded-none border-2 border-black bg-[#FFD54F] px-3 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <RailLogo />
          <div className="min-w-0">
            <p className="truncate text-sm font-black uppercase tracking-[0.14em] text-black">
              CoQuest OS
            </p>
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-black/70">
              Command Rail
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-3">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/app' && pathname.startsWith(item.href))

          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 border-2 border-black px-3 py-3 text-sm font-black uppercase tracking-[0.12em] transition-all',
                active
                  ? 'bg-[#FFD54F] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black hover:bg-[#FFF1A8] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
              ].join(' ')}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t-2 border-black p-3">
        <div className="mb-3 border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-black">
            {user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'Player One'}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-black/60">
            Active Patrol
          </p>
        </div>

        <SignOutButton redirectUrl="/">
          <button className="flex w-full items-center justify-center gap-2 border-2 border-black bg-[#FF8A80] px-3 py-3 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-[1px]">
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </SignOutButton>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        onClick={() => setMobileOpen((value) => !value)}
        className="fixed left-4 top-4 z-[70] flex h-12 w-12 items-center justify-center border-2 border-black bg-[#FFD54F] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 md:block">
        {railInner}
      </aside>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation backdrop"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-[65] w-[300px] md:hidden">
            {railInner}
          </aside>
        </>
      )}
    </>
  )
}
