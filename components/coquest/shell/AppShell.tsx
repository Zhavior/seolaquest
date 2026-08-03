import { Sidebar } from '@/components/Sidebar'
import { GuildHudBar } from '@/components/coquest/hud/GuildHudBar'
import type { GuildHudData } from '@/components/coquest/hud/types'
import type { RoomKey } from '@/components/coquest/nav/room-map-data'

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

export function AppShell({ children, hud }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[#F4F0EA] text-black">
      <div className="lg:grid lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Sidebar />

        <div className="min-w-0">
          <div className="sticky top-0 z-40">
            <GuildHudBar data={hud} />
          </div>

          <main className="mx-auto w-full max-w-[1600px] px-3 pb-8 pt-3 sm:px-4 lg:px-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
