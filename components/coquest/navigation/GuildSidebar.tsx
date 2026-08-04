'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Radar,
  Search,
  Package,
  Swords,
  User,
  Settings,
} from 'lucide-react'

const NAV = [
  { href: '/guild',        label: 'Guild',       icon: LayoutDashboard },
  { href: '/radar',        label: 'Radar',       icon: Radar },
  { href: '/keywords',     label: 'Keywords',    icon: Search },
  { href: '/leads',        label: 'Leads',       icon: Package },
  { href: '/runs',         label: 'Runs',        icon: Swords },
  { href: '/profile',      label: 'Profile',     icon: User },
  { href: '/settings',     label: 'Settings',    icon: Settings },
]

export function GuildSidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r-4 border-black bg-[#F8F5EF]">
      <div className="border-b-4 border-black p-6">
        <h1 className="text-2xl font-black tracking-widest">
          COQUEST
        </h1>
        <p className="text-sm text-black/60">
          Intelligence Engine
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-xl border-2 border-transparent px-4 py-3 font-semibold transition hover:border-black hover:bg-[#FFE16A]"
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t-4 border-black p-5">
        <p className="text-xs font-black">LEVEL 14</p>

        <div className="mt-2 h-2 overflow-hidden rounded-full border border-black bg-white">
          <div className="h-full w-3/4 bg-[#FFD84D]" />
        </div>

        <p className="mt-2 text-xs text-black/60">
          Market Hunter
        </p>
      </div>
    </aside>
  )
}
