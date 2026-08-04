'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import { SignOutButton, useUser } from '@clerk/nextjs'

import { navigation } from '../shared/navigation'
import { player } from '../shared/player'
import { PlayerStatusCard } from './PlayerStatusCard'

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
      
<div className="border-b-2 border-black bg-[#F7E6B5] p-4">
  <PlayerStatusCard
    collapsed={collapsed}
    name={displayName}
    xp={player.xp}
    title={player.title}
    quest={player.activeQuestId}
  />
</div>

<nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        {groupedNavigation.map((group) => (
          <div key={group.key} className="space-y-3">
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

            <div className="space-y-3">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      'group flex items-center gap-3 rounded-2xl border-2 border-black px-4 py-3 text-black transition-all duration-200 ease-out',
                      active
                        ? 'bg-[#FFE066] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]'
                        : 'bg-white hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#FFF8D6]',
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

      <div className="mt-auto border-t-2 border-black bg-[#FFF8D6] p-3">
        <button
          type="button"
          onClick={() => setDesktopExpanded((value) => !value)}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#FFF1A8]"
        >
          {collapsed ? 'Expand Rail' : 'Collapse Rail'}
        </button>

        <div className="mb-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-[#FFF9D9] to-[#FFEFB0] px-3 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#FED7AA]"
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
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center border-2 border-black bg-[#FFE066] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5 text-black" /> : <Menu className="h-5 w-5 text-black" />}
      </button>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block">
        <div className={`${collapsed ? 'w-24' : 'w-80'} h-full`}>{railInner}</div>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[88vw] max-w-sm flex-col overflow-hidden bg-[#FFF8D6] lg:hidden">
            {railInner}
          </div>
        </>
      )}
    </>
  )
}
