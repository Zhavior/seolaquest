import Link from 'next/link'
import { User, Zap } from 'lucide-react'

import type { ShellUser } from '@/lib/shellUser'

/**
 * The status bar's telemetry cluster: quests waiting, EXP meter, MP meter and
 * the name badge.
 *
 * A server component on purpose. Every value here is read straight from the
 * database and nothing in it responds to input, so it renders once on the
 * server and ships no JavaScript. Keeping it out of `StatusBar` is also what
 * lets the account record stop crossing the client boundary entirely.
 */
export default function ShellHud({ user }: { user?: Partial<ShellUser> }) {
  const userName = user?.name || 'HUNTER'

  // Progression mirrors the server's model exactly: `xp` is progress inside the
  // current level and `xpRequired` is that level's bar, so the HUD never claims a
  // level the database disagrees with.
  const playerLevel = user?.level ?? 1
  const playerXp = user?.xp ?? 0
  const xpRequired = user?.xpRequired ?? 100

  // MP is the scan-credit balance: one credit is spent per queued scan and
  // refunded if that scan fails. `maxCredits` is a high-water mark, so it can sit
  // at 0 for an account that has never been granted an allocation.
  const currentMp = user?.questsRemaining ?? 0
  const maxMp = Math.max(user?.maxCredits ?? 0, currentMp)
  const openQuests = user?.openQuests ?? 0

  return (
    <>
      {/* MOBILE: MP only */}
      <div className="flex md:hidden items-center gap-1 border-2 border-outline bg-card px-2 h-9 text-[9px] font-black uppercase shadow-brutal-sm">
        <Zap className="size-2.5 shrink-0 text-[#06B6D4] animate-pulse" strokeWidth={3} />
        <span>{currentMp}<span className="opacity-60">/{maxMp}</span></span>
      </div>

      {/* DESKTOP: compact pills */}
      <div className="hidden items-center gap-1.5 md:flex">

        {/* MP / scan credits */}
        <div
          title={`${currentMp} scan credits — each scan costs 1 MP`}
          className="flex items-center gap-1.5 border-2 border-outline bg-card px-2.5 h-9 text-[11px] font-black uppercase tracking-wider shadow-brutal-sm"
        >
          <Zap aria-hidden="true" className="size-3.5 shrink-0 text-[#06B6D4] animate-pulse" strokeWidth={3} />
          <span className="text-ink">{currentMp}<span className="text-ink-muted">/{maxMp}</span> MP</span>
        </div>

        {/* User name badge */}
        <div className="hidden lg:flex items-center gap-2 border-2 border-outline bg-card px-2.5 h-9 shadow-brutal-sm">
          <div className="grid size-5 shrink-0 place-items-center border-2 border-outline bg-highlight-strong">
            <User aria-hidden="true" className="size-3 text-on-accent" strokeWidth={3} />
          </div>
          <span className="max-w-[8rem] truncate font-mono text-[11px] font-black uppercase tracking-wider text-ink">
            {userName}
          </span>
        </div>
      </div>
    </>
  )
}
