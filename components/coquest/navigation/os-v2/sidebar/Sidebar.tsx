'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, X, Sparkles, PanelLeftOpen } from 'lucide-react'
import LogOutButton from '@/components/auth/LogOutButton'
import { sfx } from '@/lib/sfx'

import { type UserSummary } from '../CoQuestShell'
import { navigation } from '../../os/shared/navigation'

interface SidebarProps {
  user?: UserSummary
  collapsed?: boolean
  mobileOpen?: boolean
  onCloseMobile?: () => void
  onToggleCollapsed?: () => void
}

const sections = [
  { key: 'tactical', label: 'TACTICAL COMMAND' },
  { key: 'guild', label: 'GUILD & OPERATIONS' },
  { key: 'system', label: 'SYSTEM & VAULT' },
] as const

/**
 * Nav body without any positioning chrome. Exported as `SidebarNavigation` so
 * the mobile shell can render it inside its own off-canvas drawer.
 */
function NavigationContent({
  collapsed = false,
  mobile = false,
  onNavigate,
  onToggleCollapsed,
}: {
  collapsed?: boolean
  mobile?: boolean
  onNavigate?: () => void
  onToggleCollapsed?: () => void
}) {
  const pathname = usePathname()

  const handleToggle = () => {
    if (onToggleCollapsed) {
      onToggleCollapsed()
    } else {
      if (collapsed) {
        sfx.playSidebarExpand()
      } else {
        sfx.playSidebarCollapse()
      }
    }
  }

  if (collapsed && !mobile) {
    return (
      <div className="flex flex-col items-center justify-between h-full p-2 space-y-4 font-black">
        <div className="space-y-3 w-full flex flex-col items-center">
          <button
            type="button"
            onClick={handleToggle}
            onMouseEnter={() => sfx.playSidebarHover()}
            onFocus={() => sfx.playSidebarHover()}
            title="Expand Sidebar (Cmd+B)"
            aria-label="Expand navigation"
            className="grid size-10 place-items-center border-3 border-black bg-[#FFE600] shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-all mb-2"
          >
            <PanelLeftOpen className="size-5 text-black" strokeWidth={3} />
          </button>

          <div className="w-full h-0.5 bg-black/20 my-1" />

          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname?.startsWith(item.href) && item.href !== '/app' && item.href !== '/')
            const Icon = item.icon
            const colorClass = item.color || 'bg-[#FFE600]'

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => sfx.playSidebarHover()}
                onFocus={() => sfx.playSidebarHover()}
                onClick={() => sfx.playCoinDrop()}
                title={`${item.label} (${item.hotkey || ''})`}
                className={`relative group grid size-11 place-items-center border-3 border-black transition-all ${
                  isActive
                    ? `${colorClass} shadow-[3.5px_3.5px_0_0_#000] -translate-x-0.5 -translate-y-0.5`
                    : 'bg-white hover:bg-[#FAF7F2] hover:shadow-[3px_3px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5'
                }`}
              >
                {Icon && <Icon className="size-5 text-black" strokeWidth={3} />}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-[#FF5722] text-white text-[8px] font-black border border-black px-1 rounded-full">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on Hover */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-black text-[#FFE600] border-2 border-white text-xs font-black uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-[4px_4px_0_0_#000]">
                  {item.label}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Bottom Collapsed Icon Actions */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="grid size-10 place-items-center border-2 border-black bg-[#A3E635] shadow-[2px_2px_0_0_#000]" title="3/3 Party Agents Active">
            <span className="h-2.5 w-2.5 rounded-full bg-black border border-white animate-pulse" />
          </div>

          <LogOutButton
            title="Log Out"
            aria-label="Log out"
            onMouseEnter={() => sfx.playSidebarHover()}
            onBeforeSignOut={() => sfx.playCoinDrop()}
            className="grid size-11 place-items-center border-3 border-black bg-[#FF5722] text-white shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-all"
          >
            <LogOut className="size-5" strokeWidth={3} />
          </LogOutButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col justify-between bg-white p-4 font-black">
      <div className="space-y-5">
        {mobile ? (
          <div className="flex items-center justify-between border-b-3 border-black pb-2.5 mb-2">
            <span className="font-black text-xs uppercase tracking-widest">Navigation</span>
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation"
              className="grid size-11 place-items-center border-2 border-black bg-[#FFE600] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <X className="size-5 text-black" strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b-3 border-black pb-2.5 mb-1">
            <span className="text-xs font-black text-black tracking-[0.15em]">
              SEO la Quest
            </span>
            <button
              type="button"
              onClick={handleToggle}
              onMouseEnter={() => sfx.playSidebarHover()}
              onFocus={() => sfx.playSidebarHover()}
              title="Collapse Sidebar (Cmd+B)"
              aria-label="Collapse navigation"
              className="text-[9px] font-black uppercase bg-[#FFE600] text-black border-2 border-black px-1.5 py-0.5 shadow-[1.5px_1.5px_0_0_#000] -rotate-2 hover:bg-[#FFD600]"
            >
              ONLINE ⚔️
            </button>
          </div>
        )}

        {sections.map((section) => {
          const items = navigation.filter((item) => item.section === section.key)
          if (items.length === 0) return null

          return (
            <div key={section.key} className="space-y-2">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] px-1 flex items-center gap-1.5">
                <Sparkles className="size-3 text-black" />
                <span>{section.label}</span>
              </div>
              <div className="space-y-2">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname?.startsWith(item.href) && item.href !== '/app' && item.href !== '/')
                  const Icon = item.icon
                  const colorClass = item.color || 'bg-[#FFE600]'

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => sfx.playSidebarHover()}
                      onFocus={() => sfx.playSidebarHover()}
                      onClick={() => {
                        sfx.playCoinDrop()
                        onNavigate?.()
                      }}
                      className={`flex items-center justify-between p-3 border-3 border-black font-black text-xs uppercase tracking-wider transition-all ${
                        isActive
                          ? `${colorClass} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5`
                          : 'bg-white hover:bg-[#FAF7F2] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon className="size-4 shrink-0" strokeWidth={3} />}
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="bg-[#FF5722] text-white text-[9px] font-black border-2 border-black px-1.5 py-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                            {item.badge}
                          </span>
                        )}
                        {item.hotkey && !item.badge && (
                          <span className="font-mono text-[9px] font-black text-black bg-slate-100 border border-black px-1 py-0.2">
                            {item.hotkey}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Sidebar Mini-Party Status Card & Log Out */}
      <div className="mt-5 space-y-3 pt-2">
        <div className="border-3 border-black bg-[#A3E635] p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-black uppercase mb-1.5 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-black border border-white animate-pulse" />
              <span>Party Status</span>
            </div>
            <span className="text-black bg-[#FFE600] border-2 border-black px-1.5 text-[9px] font-black uppercase -rotate-1">
              3/3 Active
            </span>
          </div>
          <div className="text-[11px] font-bold text-black leading-snug">
            Scouts currently patrolling r/SaaS and Twitter streams.
          </div>
        </div>

        <LogOutButton
          onMouseEnter={() => sfx.playSidebarHover()}
          onBeforeSignOut={() => {
            sfx.playCoinDrop()
            onNavigate?.()
          }}
          className="w-full flex items-center justify-between p-3 border-3 border-black font-black text-xs uppercase tracking-wider bg-[#FF5722] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="size-4 shrink-0" strokeWidth={3} />
            <span>LOG OUT</span>
          </div>
          <span className="font-mono text-[9px] font-black text-black bg-[#FFE600] border border-black px-1.5">
            ESC
          </span>
        </LogOutButton>
      </div>
    </div>
  )
}

export { NavigationContent as SidebarNavigation }

export default function Sidebar({
  collapsed = false,
  mobileOpen = false,
  onCloseMobile = () => {},
  onToggleCollapsed = () => {},
}: SidebarProps) {
  return (
    <>
      <aside
        aria-label="Sidebar navigation"
        role="navigation"
        className={`border-r-4 border-black bg-white p-0 hidden md:flex flex-col justify-between shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto shrink-0 transition-[width,padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <NavigationContent collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
          />

          <aside
            aria-label="Mobile navigation"
            role="navigation"
            className="absolute inset-y-0 left-0 h-dvh w-[88vw] max-w-[320px] border-r-4 border-black bg-white shadow-[10px_0_0_rgba(0,0,0,0.25)]"
          >
            <NavigationContent mobile onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  )
}
