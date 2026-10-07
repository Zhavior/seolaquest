'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { Icon } from '@/features/handbook/artifact/IconSprite'

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

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onPointerDown={() => router.prefetch(item.href)}
            onFocus={() => router.prefetch(item.href)}
            className="dq-navitem flex-1 flex-col justify-center gap-0.5 px-1 py-1 text-[10px]"
          >
            <Icon name={item.emblem} size={24} className="shrink-0" />
            <span>{entry.label}</span>
          </Link>
        )
      })}

      <button
        type="button"
        onClick={onOpenNavigation}
        aria-controls={MOBILE_NAV_ID}
        aria-expanded={mobileOpen}
        className="dq-navitem flex-1 flex-col justify-center gap-0.5 px-1 py-1 text-[10px]"
      >
        <MoreHorizontal className="size-6 shrink-0" strokeWidth={1.5} />
        <span>More</span>
      </button>
    </nav>
  )
}
