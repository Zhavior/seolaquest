import { GuildHudBar }  from '@/components/coquest/hud/GuildHudBar'
import { RoomMapStrip } from '@/components/coquest/nav/RoomMapStrip'
import { RoomHeader }   from '@/components/coquest/room/RoomHeader'
import type { GuildHudData }  from '@/components/coquest/hud/types'
import type { RoomKey }       from '@/components/coquest/nav/room-map-data'

type AppShellProps = {
  children: React.ReactNode
  hud: GuildHudData
  room: {
    key: RoomKey
    icon: string
    title: string
    subtitle: string
  }
}

export function AppShell({ children, hud, room }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F0EA] text-black">

      {/* Tier-1: identity + operational state — always visible */}
      <div className="sticky top-0 z-50">
        <GuildHudBar data={hud} />
      </div>

      {/* Tier-2: spatial navigation — room map strip */}
      <div className="sticky top-[var(--hud-h,72px)] z-40">
        <RoomMapStrip currentRoom={room.key} />
      </div>

      {/* Tier-3: room context header — changes per route */}
      <RoomHeader icon={room.icon} title={room.title} subtitle={room.subtitle} />

      {/* Tier-4: workspace content */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 pb-8 pt-4 sm:px-4 lg:px-5">
        {children}
      </main>
    </div>
  )
}
