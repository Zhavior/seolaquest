'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, X, Sparkles, PanelLeftOpen, ShieldCheck } from 'lucide-react'
import LogOutButton from '@/components/auth/LogOutButton'
import { sfx } from '@/lib/sfx'

import { navigation, type NavigationItem } from '../../os/shared/navigation'
import { useTheme } from '@/components/theme/ThemeProvider'
import { THEME_META, type Theme } from '@/components/theme/theme-config'
import clsx from 'clsx'

interface SidebarProps {
  isAdmin?: boolean
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

/**
 * Swatch colours preview *other* themes, so they cannot come from the theme
 * tokens — those always resolve to whichever theme is currently applied. The
 * labels do come from `THEME_META`, which owns the naming.
 */
const THEME_SWATCHES: { key: Theme; bg: string; ring: string; textClass: string }[] = [
  { key: 'parchment', bg: THEME_META.parchment.swatch, ring: '#B0A090', textClass: 'text-[#4A3F2F]' },
  { key: 'grey', bg: THEME_META.grey.swatch, ring: '#4A5260', textClass: 'text-[#C8D0DC]' },
  { key: 'blue', bg: THEME_META.blue.swatch, ring: '#2A4080', textClass: 'text-[#7EB8F0]' },
]

function SidebarThemePicker({ collapsed = false, mobile = false }: { collapsed?: boolean; mobile?: boolean }) {
  const { theme, setTheme } = useTheme()

  if (collapsed && !mobile) {
    return (
      <div
        role="radiogroup"
        aria-label="Interface theme"
        className="flex flex-col gap-1.5 w-full border-t border-outline pt-3 mt-1"
      >
        {THEME_SWATCHES.map(({ key, bg, ring }) => {
          const active = theme === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={THEME_META[key].label}
              title={THEME_META[key].label}
              onClick={() => {
                if (key !== theme) {
                  setTheme(key)
                  sfx.playSidebarCollapse()
                }
              }}
              className={clsx(
                'w-full h-8 rounded-lg border transition-all duration-150',
                active ? 'shadow-none -translate-y-[1px]' : 'opacity-60 hover:opacity-90 hover:-translate-y-[1px]'
              )}
              style={{
                backgroundColor: bg,
                borderColor: active ? ring : 'rgba(0,0,0,0.35)',
              }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="mt-4 border-t border-outline pt-4">
      <p className="text-[10px] font-semibold text-ink-muted normal-case tracking-[0.18em] px-1 flex items-center gap-1.5 mb-2">
        <Sparkles className="size-3 text-ink-muted" />
        Interface Theme
      </p>
      <div
        role="radiogroup"
        aria-label="Interface theme"
        className="grid grid-cols-3 gap-1.5"
      >
        {THEME_SWATCHES.map(({ key, bg, ring, textClass }) => {
          const active = theme === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={THEME_META[key].label}
              title={THEME_META[key].label}
              onClick={() => {
                if (key !== theme) {
                  setTheme(key)
                  sfx.playSidebarCollapse()
                }
              }}
              className={clsx(
                'relative flex flex-col items-center gap-1.5 py-2 px-1 rounded-lg border font-semibold text-[9px] normal-case tracking-wide leading-none transition-all duration-150',
                'active:translate-y-[1px]',
                active
                  ? 'shadow-none -translate-y-0.5'
                  : 'opacity-60 hover:opacity-90 hover:-translate-y-0.5',
              )}
              style={{
                backgroundColor: bg,
                borderColor: active ? ring : 'rgba(0,0,0,0.35)',
                outline: active ? `2px solid ${ring}` : 'none',
                outlineOffset: '1px',
              }}
            >
              <span
                className="block w-full h-3 rounded-sm border border-black/20"
                style={{ backgroundColor: bg, filter: 'brightness(0.85) saturate(1.1)' }}
              />
              <span className={clsx('leading-none', textClass)}>{THEME_META[key].short}</span>
              {active && (
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-accent border border-outline" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const sections = [
  { key: 'tactical', label: 'Your workspace' },
  { key: 'guild', label: 'Community & growth' },
  { key: 'system', label: 'Account & resources' },
] as const

/**
 * Nav body without any positioning chrome. Exported as `SidebarNavigation` so
 * the mobile shell can render it inside its own off-canvas drawer.
 */
function NavigationContent({
  isAdmin = false,
  collapsed = false,
  mobile = false,
  onNavigate,
  onToggleCollapsed,
}: {
  isAdmin?: boolean
  collapsed?: boolean
  mobile?: boolean
  onNavigate?: () => void
  onToggleCollapsed?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const items: NavigationItem[] = isAdmin
    ? [...navigation, { label: 'Admin', href: '/app/admin', icon: ShieldCheck, section: 'system' }]
    : navigation

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
      <div className="flex flex-col items-center justify-between h-full p-2 space-y-4 font-semibold">
        <div className="space-y-3 w-full flex flex-col items-center">
          <button
            type="button"
            onClick={handleToggle}
            onMouseEnter={() => sfx.playSidebarHover()}
            onFocus={() => sfx.playSidebarHover()}
            title="Expand Sidebar (Cmd+B)"
            aria-label="Expand navigation"
            className="grid size-10 place-items-center rounded-[20px] border border-outline bg-accent shadow-none hover:-translate-y-0.5 transition-all mb-2"
          >
            <PanelLeftOpen className="size-5 text-on-accent" strokeWidth={1.75} />
          </button>

          <div className="w-full h-0.5 bg-black/20 my-1" />

          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname?.startsWith(item.href) && item.href !== '/app' && item.href !== '/')
            const Icon = item.icon
            const colorClass = 'bg-highlight text-ink'

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={() => {
                  router.prefetch(item.href)
                  sfx.playSidebarHover()
                }}
                onFocus={() => {
                  router.prefetch(item.href)
                  sfx.playSidebarHover()
                }}
                onClick={() => sfx.playCoinDrop()}
                title={`${item.label} (${item.hotkey || ''})`}
                className={`relative group grid size-11 place-items-center rounded-[20px] border border-outline transition-all ${
                  isActive
                    ? `${colorClass} shadow-sm -translate-x-0.5 -translate-y-0.5`
                    : 'bg-card hover:bg-canvas hover:shadow-none hover:-translate-x-0.5 hover:-translate-y-0.5'
                }`}
              >
                {Icon && <Icon className="size-5 text-on-accent" strokeWidth={1.75} />}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-accent-2 text-on-accent text-[8px] font-semibold border border-outline px-1 rounded-full">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on Hover */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-black text-accent rounded-lg border border-white text-xs font-semibold normal-case tracking-normal whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-sm">
                  {item.label}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Bottom Collapsed Icon Actions */}
        <div className="flex flex-col items-center gap-3 w-full">
          <SidebarThemePicker collapsed={true} />

          <LogOutButton
            title="Log Out"
            aria-label="Log out"
            onMouseEnter={() => sfx.playSidebarHover()}
            onBeforeSignOut={() => sfx.playCoinDrop()}
            className="grid size-11 place-items-center rounded-[20px] border border-outline bg-accent-2 text-on-accent shadow-none hover:-translate-y-0.5 transition-all"
          >
            <LogOut className="size-5" strokeWidth={1.75} />
          </LogOutButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col justify-between bg-card p-4 font-semibold">
      <div className="space-y-5">
        {mobile ? (
          <div className="flex items-center justify-between border-b border-outline pb-2.5 mb-2">
            <span className="font-semibold text-xs normal-case tracking-wide">Navigation</span>
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation"
              className="grid size-11 place-items-center rounded-lg border border-outline bg-accent shadow-none active:translate-x-[1px] active:translate-y-[1px]"
            >
              <X className="size-5 text-on-accent" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-outline pb-2.5 mb-1">
            <span className="text-xs font-semibold text-ink tracking-[0.04em]">
              SEOlaQuest
            </span>
            <button
              type="button"
              onClick={handleToggle}
              onMouseEnter={() => sfx.playSidebarHover()}
              onFocus={() => sfx.playSidebarHover()}
              title="Collapse Sidebar (Cmd+B)"
              aria-label="Collapse navigation"
              className="text-[9px] font-semibold normal-case bg-accent text-on-accent rounded-lg border border-outline px-1.5 py-0.5 shadow-none  hover:bg-highlight-strong"
            >
              Collapse
            </button>
          </div>
        )}

        {sections.map((section) => {
          const sectionItems = items.filter((item) => item.section === section.key)
          if (sectionItems.length === 0) return null

          return (
            <div key={section.key} className="space-y-2">
              <div className="text-[10px] font-semibold text-ink-muted normal-case tracking-[0.18em] px-1 flex items-center gap-1.5">
                <Sparkles className="size-3 text-ink" />
                <span>{section.label}</span>
              </div>
              <div className="space-y-2">
                {sectionItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname?.startsWith(item.href) && item.href !== '/app' && item.href !== '/')
                  const Icon = item.icon
                  const colorClass = 'bg-highlight text-ink'

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                aria-current={isActive ? 'page' : undefined}
                      onMouseEnter={() => {
                        router.prefetch(item.href)
                        sfx.playSidebarHover()
                      }}
                      onFocus={() => {
                        router.prefetch(item.href)
                        sfx.playSidebarHover()
                      }}
                      onClick={() => {
                        sfx.playCoinDrop()
                        onNavigate?.()
                      }}
                      className={`flex items-center justify-between p-3 rounded-[20px] border border-outline font-semibold text-xs normal-case tracking-normal transition-all ${
                        isActive
                          ? `${colorClass} shadow-sm -translate-x-0.5 -translate-y-0.5`
                          : 'bg-card hover:bg-canvas hover:shadow-none hover:-translate-x-0.5 hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.75} />}
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="bg-accent-2 text-on-accent text-[9px] font-semibold rounded-lg border border-outline px-1.5 py-0.5 shadow-none">
                            {item.badge}
                          </span>
                        )}
                        {item.hotkey && !item.badge && (
                          <span className="font-mono text-[9px] font-semibold text-ink bg-inset border border-outline px-1 py-0.2">
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
        <SidebarThemePicker mobile={mobile} />

        <LogOutButton
          onMouseEnter={() => sfx.playSidebarHover()}
          onBeforeSignOut={() => {
            sfx.playCoinDrop()
            onNavigate?.()
          }}
          className="w-full flex items-center justify-between p-3 rounded-[20px] border border-outline font-semibold text-xs normal-case tracking-normal bg-accent-2 text-on-accent shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sm active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
            <span>LOG OUT</span>
          </div>
          <span className="font-mono text-[9px] font-semibold text-on-accent bg-accent border border-outline px-1.5">
            ESC
          </span>
        </LogOutButton>
      </div>
    </div>
  )
}

export { NavigationContent as SidebarNavigation }

/**
 * The desktop rail. Mobile is not this component's business: `MobileAppShell`
 * owns the off-canvas drawer — with the focus trap, Escape handling and scroll
 * lock a drawer needs — and fills it with `SidebarNavigation`. A second drawer
 * lived here until it turned out nothing mounted it.
 */
export default function Sidebar({ isAdmin = false, collapsed = false, onToggleCollapsed = () => {} }: SidebarProps) {
  return (
    <aside
      aria-label="Sidebar navigation"
      role="navigation"
      className={`border-r border-outline bg-card p-0 hidden md:flex flex-col justify-between  h-full overflow-y-auto shrink-0 transition-[width,padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <NavigationContent isAdmin={isAdmin} collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
    </aside>
  )
}
