'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, X, PanelLeftOpen, PanelLeftClose, ShieldCheck } from 'lucide-react'
import LogOutButton from '@/components/auth/LogOutButton'
import { Icon } from '@/features/handbook/artifact/IconSprite'
import { sfx } from '@/lib/sfx'

import { navigation, type NavigationItem } from '../../os/shared/navigation'
import clsx from 'clsx'

interface SidebarProps {
  isAdmin?: boolean
  collapsed?: boolean
  onToggleCollapsed?: () => void
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
    ? [...navigation, { label: 'Admin', href: '/app/admin', icon: ShieldCheck, emblem: 'padlock', section: 'system' }]
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

  const isActiveItem = (item: NavigationItem) =>
    pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/app' && item.href !== '/')

  const navHandlers = (item: NavigationItem) => ({
    onMouseEnter: () => {
      router.prefetch(item.href)
      sfx.playSidebarHover()
    },
    onFocus: () => {
      router.prefetch(item.href)
      sfx.playSidebarHover()
    },
  })

  if (collapsed && !mobile) {
    return (
      <div className="flex h-full flex-col items-center justify-between gap-4 px-2 py-3">
        <div className="flex w-full flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            onMouseEnter={() => sfx.playSidebarHover()}
            onFocus={() => sfx.playSidebarHover()}
            title="Expand Sidebar (Cmd+B)"
            aria-label="Expand navigation"
            className="dq-plate dq-plate--ghost dq-plate--square mb-1"
          >
            <PanelLeftOpen className="size-4" strokeWidth={1.75} />
          </button>

          <div aria-hidden="true" className="my-1 h-px w-8 bg-outline" />

          {items.map((item) => {
            const isActive = isActiveItem(item)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                {...navHandlers(item)}
                onClick={() => sfx.playCoinDrop()}
                title={item.hotkey ? `${item.label} (${item.hotkey})` : item.label}
                className="dq-navitem dq-navitem--icon group"
              >
                <Icon name={item.emblem} size={26} />
                {item.badge && (
                  <span className="absolute -right-1 -top-1 bg-accent px-1 font-mono text-[8px] text-on-accent">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on hover */}
                <span
                  aria-hidden="true"
                  className="dq-glass pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap px-3 py-1.5 text-[11px] text-[#f6ebd2] opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>

        <LogOutButton
          title="Log Out"
          aria-label="Log out"
          onMouseEnter={() => sfx.playSidebarHover()}
          onBeforeSignOut={() => sfx.playCoinDrop()}
          className="dq-navitem dq-navitem--icon"
        >
          <LogOut className="size-5" strokeWidth={1.75} />
        </LogOutButton>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col justify-between gap-6 p-4">
      <div className="space-y-6">
        {mobile ? (
          <div className="flex items-center justify-between border-b border-outline pb-3">
            <span className="dq-brand-word flex items-center gap-2 text-lg">
              <Icon name="crest" size={26} />
              SEOlaQuest
            </span>
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation"
              className="dq-plate dq-plate--ghost dq-plate--square"
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-outline pb-3">
            <span className="dq-section-label">Quest journal</span>
            <button
              type="button"
              onClick={handleToggle}
              onMouseEnter={() => sfx.playSidebarHover()}
              onFocus={() => sfx.playSidebarHover()}
              title="Collapse Sidebar (Cmd+B)"
              aria-label="Collapse navigation"
              className="grid size-9 place-items-center border border-outline text-[#d9d0ec] transition-colors hover:border-[#d8a93b] hover:text-[#f3d58a]"
            >
              <PanelLeftClose className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        )}

        {sections.map((section) => {
          const sectionItems = items.filter((item) => item.section === section.key)
          if (sectionItems.length === 0) return null

          return (
            <div key={section.key} className="space-y-1.5">
              <p className="dq-section-label flex items-center gap-2 px-1 pb-1">
                <span aria-hidden="true" className="inline-block size-1.5 rotate-45 bg-[#a8832f]" />
                {section.label}
              </p>
              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const isActive = isActiveItem(item)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      {...navHandlers(item)}
                      onClick={() => {
                        sfx.playCoinDrop()
                        onNavigate?.()
                      }}
                      className="dq-navitem justify-between"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon name={item.emblem} size={24} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge ? (
                        <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] text-on-accent">{item.badge}</span>
                      ) : item.hotkey ? (
                        <kbd className="dq-key">{item.hotkey}</kbd>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <LogOutButton
        onMouseEnter={() => sfx.playSidebarHover()}
        onBeforeSignOut={() => {
          sfx.playCoinDrop()
          onNavigate?.()
        }}
        className="dq-navitem w-full justify-between border-outline"
      >
        <span className="flex items-center gap-3">
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
          <span>Log out</span>
        </span>
      </LogOutButton>
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
      className={clsx(
        'dq-rail hidden h-full shrink-0 flex-col justify-between overflow-y-auto transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <NavigationContent isAdmin={isAdmin} collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
    </aside>
  )
}
