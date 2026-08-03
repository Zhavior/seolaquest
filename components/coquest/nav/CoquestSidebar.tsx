'use client'

import Link from 'next/link'
import { ROOM_ROUTE_META } from './room-route-meta'
import type { RoomKey } from './room-map-data'

type Props = {
  currentRoom: RoomKey
}

export function CoquestSidebar({ currentRoom }: Props) {
  return (
    <aside className="hidden w-72 shrink-0 border-r-4 border-black bg-[#FFFDF8] lg:block">
      <nav className="flex flex-col gap-2 p-4">
        {ROOM_ROUTE_META.map((room) => {
          const active = room.key === currentRoom

          return (
            <Link
              key={room.path}
              href={room.path}
              className={[
                'rounded-xl border-4 border-black p-3 transition-all',
                active
                  ? 'bg-yellow-300 shadow-[4px_4px_0_0_#000]'
                  : 'bg-white hover:bg-zinc-100',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{room.icon}</span>

                <div className="min-w-0">
                  <div className="font-black leading-none">
                    {room.title}
                  </div>

                  <div className="mt-1 text-xs text-zinc-600">
                    {room.subtitle}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
