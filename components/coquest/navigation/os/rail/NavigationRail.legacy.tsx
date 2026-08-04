'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Command, LogOut, Menu, Sparkles, X } from 'lucide-react'
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
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()

      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable ||
        document.querySelector('[role="dialog"]')
      ) {
        return
      }

      const match = navigation.find(
        (item) => item.hotkey?.toLowerCase() === event.key.toLowerCase()
      )

      if (!match) return
      window.location.assign(match.href)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const collapsed = !desktopExpanded
  const displayName =
    user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'Player One'

  const navIconClass =
    'h-[18px] w-[18px] shrink-0 [image-rendering:pixelated] drop-shadow-[1px_1px_0px_rgba(255,255,255,0.22)]'

  const groupedNavigation = useMemo(
    () => [
      { key: 'tactical', label: 'Tactical' as const, items: navigation.filter((item) => item.section === 'tactical') },
      { key: 'guild', label: 'Guild & Ops' as const, items: navigation.filter((item) => item.section === 'guild') },
      { key: 'system', label: 'System' as const, items: navigation.filter((item) => item.section === 'system') },
    ],
    []
  )

  const railInner = (
    <div
      className={[
        'flex h-full flex-col border-r-2 border-black bg-[#FFF8D6] transition-all duration-150 ease-out',
        collapsed ? 'opacity-95' : 'opacity-100',
      ].join(' ')}
    >
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
              <Link
                href="/app"
                aria-label="Quick Search"
                title="Quick Search"
                onClick={() => setMobileOpen(false)}
                className="mt-3 inline-flex items-center gap-2 border-2 border-black bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#FFF1A8]"
              >
                <Command className="h-3.5 w-3.5" />
                <span>Quick Search</span>
                <span className="inline-flex items-center border border-black bg-[#FFD54F] px-1.5 py-0.5 text-[10px] font-black leading-none text-black">
                  ⌘K
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-4 p-3">
        {groupedNavigation.map((group) => (
          <div key={group.key} className="space-y-2">
            {!collapsed ? (
              <div className="px-1">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/55">
                  {group.label}
                </p>
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <span className="h-2 w-8 border border-black bg-black/10" />
              </div>
            )}

            <div className="space-y-2">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      'group flex items-center gap-3 border-2 border-black px-3 py-3 text-black transition-all duration-200',
                      active
                        ? 'bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white hover:-translate-y-[1px] hover:bg-[#FFF1A8]',
                      collapsed ? 'justify-center' : '',
                    ].join(' ')}
                  >
                    <item.icon className={navIconClass} />
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-black uppercase tracking-[0.12em]">
                          {item.label}
                        </div>
                        {item.description ? (
                          <div className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-black/55">
                            {item.description}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t-2 border-black p-3">
        <button
          type="button"
          onClick={() => setDesktopExpanded((value) => !value)}
          className="mb-3 flex w-full items-center justify-center gap-2 border-2 border-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#FFF1A8]"
        >
          {collapsed ? 'Expand Rail' : 'Collapse Rail'}
        </button>

        <div className="mb-3 border-2 border-black bg-[#FFF1A8] px-3 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-black">
            {collapsed ? 'CQ' : displayName}
          </p>
          {!collapsed && (
            <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-black/55">
              Signed in operative
            </p>
          )}
        </div>

        <SignOutButton>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 border-2 border-black bg-[#FFEDD5] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#FED7AA]"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </SignOutButton>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={() => setMobileOpen((value) => !value)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center border-2 border-black bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5 text-black" /> : <Menu className="h-5 w-5 text-black" />}
      </button>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block">
        <div className={`${collapsed ? 'w-[92px]' : 'w-[288px]'} h-full`}>{railInner}</div>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[288px] max-w-[86vw] lg:hidden">{railInner}</div>
        </>
      )}
    </>
  )
}
