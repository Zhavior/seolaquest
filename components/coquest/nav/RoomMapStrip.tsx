import Link from 'next/link'
import { ROOM_MAP, type RoomKey } from './room-map-data'

export function RoomMapStrip({ currentRoom }: { currentRoom: RoomKey }) {
  return (
    <nav aria-label="Headquarters rooms" className="border-b-4 border-black bg-white shadow-[0_4px_0_0_#000]">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 overflow-x-auto px-3 py-2 sm:px-4 lg:px-5">
        {ROOM_MAP.map((room) => {
          const active = room.key === currentRoom

          return (
            <Link
              key={room.key}
              href={room.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'inline-flex min-h-11 shrink-0 items-center gap-2 border-4 px-3',
                'text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-150',
                active
                  ? 'border-black bg-[#FFE600] text-black shadow-[3px_3px_0_0_#000]'
                  : 'border-black bg-[#F4F0EA] text-black hover:-translate-y-px hover:bg-white',
              ].join(' ')}
            >
              <span aria-hidden="true" className="text-sm">
                {room.icon}
              </span>
              <span>{room.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
