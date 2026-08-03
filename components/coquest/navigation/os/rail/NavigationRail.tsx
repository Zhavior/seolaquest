'use client'

import RailLogo from './RailLogo'
import { navigation } from '../shared/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavigationRail() {
  const pathname = usePathname()

  return (
    <aside className="group flex h-screen w-20 flex-col border-r-4 border-black bg-[#F8F5EF] transition-all duration-300 hover:w-72">

      <RailLogo />

      <nav className="flex-1 space-y-2 p-3">

        {navigation.map(item => {

          const Icon = item.icon
          const active = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex h-12 items-center rounded-xl px-4 transition-all",
                active
                  ? "border-2 border-black bg-[#FFD84D] shadow-[4px_4px_0_0_#000]"
                  : "hover:bg-[#FFF2B3]"
              ].join(' ')}
            >
              <Icon className="h-5 w-5 shrink-0" />

              <span className="ml-4 hidden font-semibold group-hover:block">
                {item.label}
              </span>
            </Link>
          )

        })}

      </nav>

    </aside>
  )
}
