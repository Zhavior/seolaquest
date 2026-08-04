'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Menu, Sparkles, X } from 'lucide-react'
import { SignOutButton, useUser } from '@clerk/nextjs'

import RailLogo from './RailLogo'
import { navigation } from '../shared/navigation'

export default function NavigationRail() {
  const pathname = usePathname()
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopExpanded, setDesktopExpanded] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const collapsed = !desktopExpanded
  const displayName =
    user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'Player One'

  const railInner = (
    <div className="flex h-full flex-col border-r-2 border-black bg-[#FFF8D6]">
      <div className="border-b-2 border-black bg-[#F97316] p-3">
        <div
          className={[
            'overflow-hidden border-2 border-black bg-[#FFD54F] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200',
            collapsed
              ? 'flex min-h-[88px] items-center justify-center px-2 py-3'
              : 'flex min-h-[88px] items-center gap-3 px-3 py-3',
          ].join(' ')}
        >
          <div className="shrink-0">
            <RailLogo compact={collapsed} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase tracking-[0.16em] text-black">
                CoQuest OS
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black/70">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Command Rail</span>
              </div>
            </div>
          )}
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
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={[
                'group relative border-2 border-black text-sm font-black uppercase tracking-[0.12em] transition-all duration-200 ease-out',
                collapsed
                  ? 'flex h-12 items-center justify-center px-0'
                  : 'flex h-12 items-center gap-3 px-3',
                active
                  ? 'bg-[#FFD54F] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black hover:-translate-y-[1px] hover:bg-[#FFF1A8] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
              ].join(' ')}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}

              {collapsed && (
                <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap border-2 border-black bg-[#FFD54F] px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:block">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t-2 border-black p-3">
        <div
          className={[
            'mb-3 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200',
            collapsed ? 'flex h-12 items-center justify-center px-2' : 'p-3',
          ].join(' ')}
          title={collapsed ? displayName : undefined}
        >
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center border-2 border-black bg-[#FFD54F] text-[11px] font-black uppercase text-black">
              {displayName.slice(0, 2)}
            </div>
          ) : (
            <>
              <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-black">
                {displayName}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-black/60">
                Active Patrol
              </p>
            </>
          )}
        </div>

        <SignOutButton redirectUrl="/">
          <button
            aria-label="Log Out"
            title={collapsed ? 'Log Out' : undefined}
            className={[
              'border-2 border-black bg-[#FF8A80] text-sm font-black uppercase tracking-[0.12em] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-[1px]',
              collapsed
                ? 'flex h-12 w-full items-center justify-center'
                : 'flex h-12 w-full items-center justify-center gap-2 px-3',
            ].join(' ')}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Log Out</span>}
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
        className="fixed left-4 top-4 z-[70] flex h-12 w-12 items-center justify-center border-2 border-black bg-[#F97316] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        onMouseEnter={() => setDesktopExpanded(true)}
        onMouseLeave={() => setDesktopExpanded(false)}
        onFocusCapture={() => setDesktopExpanded(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDesktopExpanded(false)
          }
        }}
        className={[
          'sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 ease-out md:block',
          collapsed ? 'w-[92px]' : 'w-[292px]',
        ].join(' ')}
      >
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
