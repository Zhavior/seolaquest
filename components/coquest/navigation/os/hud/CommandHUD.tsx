import { Bell, Command, Search, Swords, Zap } from 'lucide-react'

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
  const xpPercent =
    user.xpRequired > 0 ? Math.min(100, Math.round((user.xp / user.xpRequired) * 100)) : 0

  return (
    <header className="relative z-30 border-b-2 border-black bg-[#FFF8D6]">
      <div className="grid min-h-20 grid-cols-1 gap-4 px-4 py-3 lg:grid-cols-[220px_minmax(320px,1fr)_auto] lg:items-center lg:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/55">
            Battle Area
          </p>

          <h1 className="truncate text-xl font-black uppercase text-black">
            {playerName}
          </h1>

          <p className="truncate text-sm font-bold text-black/65">
            {playerTitle} • Level {user.level}
          </p>

          <div className="mt-2 hidden max-w-[220px] lg:block">
            <div className="h-2 overflow-hidden border-2 border-black bg-white">
              <div
                className="h-full bg-[#F97316] transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-black/55">
              XP {user.xp.toLocaleString()} / {user.xpRequired.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-3 md:flex">
          <div className="flex w-full min-w-0 items-center gap-2 border-2 border-black bg-white px-3 py-2">
            <Search className="h-4 w-4 shrink-0" />
            <input
              className="w-full min-w-0 bg-transparent text-sm font-bold outline-none"
              placeholder="Search quests, guilds, campaigns..."
            />
          </div>

          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-2 border-2 border-black bg-[#FFD54F] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-black"
          >
            <Command className="h-4 w-4" />
            ⌘K
          </button>
        </div>

        <div className="flex justify-start lg:justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-2 border-black bg-[#FFD54F] px-3 py-2">
              <div className="flex items-center gap-2 font-black">
                <Zap className="h-4 w-4" />
                <span>{user.maxCredits}</span>
              </div>
              <div className="text-[10px] font-bold uppercase">
                Mana
              </div>
            </div>

            <div className="border-2 border-black bg-white px-3 py-2">
              <div className="font-black">
                {user.questsRemaining}
              </div>
              <div className="text-[10px] font-bold uppercase">
                Quests
              </div>
            </div>

            <div className="hidden border-2 border-black bg-white px-3 py-2 xl:block">
              <div className="font-black">
                {user.spellsCast}
              </div>
              <div className="text-[10px] font-bold uppercase">
                Casts
              </div>
            </div>

            <button className="relative border-2 border-black bg-white p-2">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 inline-flex min-w-[20px] items-center justify-center border-2 border-black bg-[#FFE600] px-1 text-[10px] font-black text-black">
                2
              </span>
            </button>

            <button className="border-2 border-black bg-[#F97316] p-2">
              <Swords className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
