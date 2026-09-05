'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'

import { navigation } from '../../os/shared/navigation'
import { MOBILE_NAV_ID } from './MobileAppShell'

/** Primary destinations, with thumb-sized labels for the tray. */
const PRIMARY = [
  { href: '/app', label: 'Home' },
  { href: '/app/quests', label: 'Quests' },
  { href: '/app/keywords', label: 'Keywords' },
  { href: '/app/guild', label: 'Guild' },
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
  const router = useRouter()

  return (
    <nav aria-label="Primary mobile navigation" className="flex w-full items-stretch gap-1.5">
      {PRIMARY.map((entry) => {
        const item = navigation.find((candidate) => candidate.href === entry.href)
        if (!item) return null

        const isActive =
          pathname === item.href ||
          (pathname?.startsWith(item.href) && item.href !== '/app' && item.href !== '/')
        const Icon = item.icon
        const colorClass = 'bg-highlight'

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onPointerDown={() => router.prefetch(item.href)}
            onFocus={() => router.prefetch(item.href)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] border border-outline py-2 text-xs font-semibold normal-case tracking-wide transition-all ${
              isActive
                ? `${colorClass} -translate-y-0.5 shadow-none`
                : 'bg-card active:translate-y-0 active:shadow-none'
            }`}
          >
            <Icon className="size-4 shrink-0 text-ink" strokeWidth={1.75} />
            <span className="text-ink">{entry.label}</span>
          </Link>
        )
      })}

      <button
        type="button"
        onClick={onOpenNavigation}
        aria-controls={MOBILE_NAV_ID}
        aria-expanded={mobileOpen}
        className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] border border-outline bg-card py-2 text-xs font-semibold normal-case tracking-wide active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      >
        <MoreHorizontal className="size-4 shrink-0 text-on-accent" strokeWidth={1.75} />
        <span className="text-ink">More</span>
      </button>
    </nav>
  )
}
