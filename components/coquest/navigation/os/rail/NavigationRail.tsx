'use client'

import { useState, useEffect } from 'react'
import RailLogo from './RailLogo'
import { navigation } from '../shared/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { LogOut, Menu, X, LayoutDashboard, History, Send } from 'lucide-react'

const bottomNav = [
  { label: 'Battlestation', href: '/app',           icon: LayoutDashboard },
  { label: 'Scan Runs',     href: '/app/runs',       icon: History         },
  { label: 'Deliveries',    href: '/app/deliveries', icon: Send            },
]

export default function NavigationRail() {
  const pathname = usePathname()
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const displayName = user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? 'Hunter'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      {/* ── DESKTOP rail (hidden on mobile) ── */}
      <aside className="group hidden md:flex h-screen w-20 flex-col border-r-4 border-black bg-[#F8F5EF] transition-all duration-300 hover:w-72 shrink-0">
        <RailLogo />

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map(item => {
            const Icon = item.icon
            const active = item.href === '/app'
              ? pathname === '/app'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex h-12 items-center rounded-xl px-4 transition-all',
                  active
                    ? 'border-2 border-black bg-[#FFD84D] shadow-[4px_4px_0_0_#000]'
                    : 'hover:bg-[#FFF2B3]',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="ml-4 hidden truncate font-semibold group-hover:block">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t-4 border-black p-3 space-y-1">
          <div className="flex h-12 items-center rounded-xl px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[#FFD84D] text-xs font-black">
              {initials}
            </div>
            <div className="ml-4 hidden min-w-0 group-hover:block">
              <p className="truncate text-sm font-bold leading-tight">{displayName}</p>
              <p className="truncate text-xs text-neutral-500">Hunter</p>
            </div>
          </div>
          <SignOutButton redirectUrl="/">
            <button className="flex h-12 w-full items-center rounded-xl px-4 text-red-600 transition-all hover:bg-red-50">
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="ml-4 hidden font-semibold group-hover:block">Log out</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* ── MOBILE: backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE: slide-in drawer ── */}
      <div className={[
        'md:hidden fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-4 border-black bg-[#F8F5EF]',
        'transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>

        <div className="flex h-20 items-center justify-between border-b-4 border-black px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-4 border-black bg-[#FFD84D] font-black shadow-[4px_4px_0_0_#000]">
            CQ
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black hover:bg-[#FFF2B3]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map(item => {
            const Icon = item.icon
            const active = item.href === '/app'
              ? pathname === '/app'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex h-12 items-center rounded-xl px-4 transition-all',
                  active
                    ? 'border-2 border-black bg-[#FFD84D] shadow-[4px_4px_0_0_#000]'
                    : 'hover:bg-[#FFF2B3]',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="ml-4 truncate font-semibold">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t-4 border-black p-3 space-y-1">
          <div className="flex h-12 items-center rounded-xl px-4 gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[#FFD84D] text-xs font-black">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">{displayName}</p>
              <p className="truncate text-xs text-neutral-500">Hunter</p>
            </div>
          </div>
          <SignOutButton redirectUrl="/">
            <button className="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-red-600 transition-all hover:bg-red-50">
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="font-semibold">Log out</span>
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* ── MOBILE: bottom tab bar (hidden when drawer open) ── */}
      <nav className={[
        'md:hidden fixed bottom-0 inset-x-0 z-30',
        'flex items-center justify-around',
        'h-16 border-t-4 border-black bg-[#F8F5EF]',
        'transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-y-full' : 'translate-y-0',
      ].join(' ')}>

        {bottomNav.map(item => {
          const Icon = item.icon
          const active = item.href === '/app'
            ? pathname === '/app'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 h-full"
            >
              <div className={[
                'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
                active
                  ? 'bg-[#FFD84D] border-2 border-black shadow-[2px_2px_0_0_#000]'
                  : '',
              ].join(' ')}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </Link>
          )
        })}

        {/* Sidebar toggle button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 h-full"
          aria-label="Open menu"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl transition-all">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-semibold leading-none">Menu</span>
        </button>

      </nav>
    </>
  )
}
