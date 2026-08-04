import { Bell, Search, Swords, Zap } from 'lucide-react'

interface CommandHUDUser {
  name: string | null
  title: string | null
  level: number
  xp: number
  xpRequired: number
  questsRemaining: number
  spellsCast: number
  questsExported: number
  maxCredits: number
  profileIconKey: string | null
}

interface CommandHUDProps {
  user: CommandHUDUser
}

export default function CommandHUD({ user }: CommandHUDProps) {
  const playerName = user.name ?? 'Hunter'
  const playerTitle = user.title ?? 'Adventurer'

  return (
    <header className="sticky top-0 z-40 border-b-2 border-black bg-[#FFF8D6]">
      <div className="flex h-20 items-center justify-between gap-6 px-6">

        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/60">
            Battle Area
          </p>

          <h1 className="truncate text-xl font-black">
            {playerName}
          </h1>

          <p className="truncate text-sm font-bold text-black/70">
            {playerTitle} • Level {user.level}
          </p>
        </div>

        <div className="hidden flex-1 justify-center xl:flex">
          <div className="flex w-full max-w-xl items-center gap-2 border-2 border-black bg-white px-3 py-2 shadow-[3px_3px_0_0_#000]">
            <Search className="h-4 w-4 shrink-0" />
            <input
              className="w-full bg-transparent text-sm font-bold outline-none"
              placeholder="Search quests, guilds, campaigns..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">

          <div className="border-2 border-black bg-[#FFD54F] px-3 py-2 shadow-[3px_3px_0_0_#000]">
            <div className="flex items-center gap-2 font-black">
              <Zap className="h-4 w-4" />
              <span>{user.maxCredits}</span>
            </div>
            <div className="text-[10px] font-bold uppercase">
              Mana
            </div>
          </div>

          <div className="border-2 border-black bg-white px-3 py-2 shadow-[3px_3px_0_0_#000]">
            <div className="font-black">
              {user.questsRemaining}
            </div>
            <div className="text-[10px] font-bold uppercase">
              Quests
            </div>
          </div>

          <button className="border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000]">
            <Bell className="h-5 w-5" />
          </button>

          <button className="border-2 border-black bg-[#F97316] p-2 shadow-[3px_3px_0_0_#000]">
            <Swords className="h-5 w-5" />
          </button>

        </div>
      </div>
    </header>
  )
}
