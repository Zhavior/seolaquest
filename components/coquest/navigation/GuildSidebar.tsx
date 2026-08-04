'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Package,
  Swords,
  User,
  Settings,
} from 'lucide-react'

const NAV = [
  { href: '/app/guild', label: 'Guild', icon: LayoutDashboard },
  { href: '/app/keywords', label: 'Keywords', icon: Search },
  { href: '/app/deliveries', label: 'Deliveries', icon: Package },
  { href: '/app/runs', label: 'Runs', icon: Swords },
]

const FOOTER = [
  { href: '/app/profile', label: 'Profile', icon: User },
  { href: '/app/settings', label: 'Settings', icon: Settings },
]

export function GuildSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[300px] flex-col border-r border-neutral-200 bg-white">

      <div className="px-8 py-10">
        <h1 className="text-2xl font-black tracking-[0.22em] tracking-[0.18em]">
          COQUEST
        </h1>
      </div>

      <nav className="flex-1 px-3">

        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`mb-1 flex items-center gap-3 rounded-2xl px-5 py-4 transition ${
                active
                  ? 'bg-[#FFF3BF] border border-[#FFD84D] font-semibold'
                  : 'hover:bg-neutral-100'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}

      </nav>

      </aside>
  )
}
