'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'

import { navigation } from '../../os/shared/navigation'
import { MOBILE_NAV_ID } from './MobileAppShell'

/** Primary destinations, with thumb-sized labels for the tray. */
const PRIMARY = [
  { href: '/app', label: 'HQ' },
  { href: '/app/quests', label: 'QUESTS' },
  { href: '/app/keywords', label: 'LOG' },
  { href: '/app/guild', label: 'GUILD' },
] as const

interface MobileBottomNavProps {
  mobileOpen?: boolean
  onOpenNavigation: () => void
}

export default function MobileBottomNav({
  mobileOpen = false,
  onOpenNavigation,
}: MobileBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary mobile navigation" className="flex w-full items-stretch gap-1.5">
      {PRIMARY.map((entry) => {
        const item = navigation.find((candidate) => candidate.href === entry.href)
        if (!item) return null

        const isActive =
          pathname === item.href ||
          (pathname?.startsWith(item.href) && item.href !== '/app' && item.href !== '/')
        const Icon = item.icon
        const colorClass = item.color || 'bg-accent'

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 border-3 border-outline py-2 text-xs font-black uppercase tracking-wide transition-all ${
              isActive
                ? `${colorClass} -translate-y-0.5 shadow-brutal-sm`
                : 'bg-card active:translate-y-0 active:shadow-none'
            }`}
          >
            <Icon className="size-4 shrink-0 text-ink" strokeWidth={3} />
            <span className="text-ink">{entry.label}</span>
          </Link>
        )
      })}

      <button
        type="button"
        onClick={onOpenNavigation}
        aria-controls={MOBILE_NAV_ID}
        aria-expanded={mobileOpen}
        className="flex flex-1 flex-col items-center justify-center gap-1 border-3 border-outline bg-accent py-2 text-xs font-black uppercase tracking-wide active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      >
        <MoreHorizontal className="size-4 shrink-0 text-on-accent" strokeWidth={3} />
        <span className="text-ink">MORE</span>
      </button>
    </nav>
  )
}
