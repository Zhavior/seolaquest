'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigation } from '../shared/navigation'

export default function NavigationRail() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-20 flex-col border-r-4 border-black bg-[#F8F5EF] transition-all duration-300 hover:w-72 group">

      <div className="flex h-20 items-center justify-center border-b-4 border-black font-black text-xl">
        CQ
      </div>

      <nav className="flex-1 p-3 space-y-2">

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
                  ? "bg-[#FFD84D] border-2 border-black shadow-[4px_4px_0_0_#000]"
                  : "hover:bg-[#FFF2B3]"
              ].join(' ')}
            >
              <Icon className="h-5 w-5 shrink-0" />

              <span className="ml-4 hidden whitespace-nowrap font-semibold group-hover:block">
                {item.label}
              </span>
            </Link>
          )

        })}

      </nav>

      <div className="border-t-4 border-black p-4">

        <div className="hidden group-hover:block">

          <div className="text-xs font-black">
            AI ONLINE
          </div>

          <div className="mt-2 h-2 rounded-full border border-black bg-white overflow-hidden">
            <div className="h-full w-full bg-green-500"></div>
          </div>

        </div>

      </div>

    </aside>
  )
}
