'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { navigation } from '../shared/navigation'

const sections = [
  { key: 'tactical', title: 'Tactical' },
  { key: 'guild', title: 'Guild & Ops' },
  { key: 'system', title: 'System' },
] as const

interface SidebarNavigationProps {
  collapsed: boolean
}

export function SidebarNavigation({
  collapsed,
}: SidebarNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
      {sections.map((section) => (
        <div key={section.key} className="mb-8">
          {!collapsed && (
            <p className="mb-3 px-2 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
              {section.title}
            </p>
          )}

          <div className="space-y-2">
            {navigation
              .filter((item) => item.section === section.key)
              .map((item) => {
                const Icon = item.icon
                const active = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "group flex items-center rounded-2xl border-2 border-black transition-all duration-200",
                      collapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                      active
                        ? "bg-[#FFE066] shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                        : "bg-[#FFF8D6] hover:-translate-y-0.5 hover:bg-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />

                    {!collapsed && (
                      <div className="flex-1">
                        <div className="font-bold">
                          {item.label}
                        </div>

                        {item.description && (
                          <div className="text-xs text-stone-600">
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}

                    {!collapsed && item.badge && (
                      <span className="rounded-full border-2 border-black bg-white px-2 py-0.5 text-[10px] font-black">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
          </div>
        </div>
      ))}
    </nav>
  )
}
