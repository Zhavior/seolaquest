import Link from 'next/link'
import { Scroll, Sparkles, User, Zap } from 'lucide-react'

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
  const xpPercent = xpRequired > 0 ? Math.min(100, Math.round((playerXp / xpRequired) * 100)) : 0
  const activeXpSegments = Math.round((xpPercent / 100) * 8)

  // MP is the scan-credit balance: one credit is spent per queued scan and
  // refunded if that scan fails. `maxCredits` is a high-water mark, so it can sit
  // at 0 for an account that has never been granted an allocation.
  const currentMp = user?.questsRemaining ?? 0
  const maxMp = Math.max(user?.maxCredits ?? 0, currentMp)
  const activeManaSegments = maxMp > 0 ? Math.round((currentMp / maxMp) * 8) : 0
  const openQuests = user?.openQuests ?? 0

  return (
    <>
      {/* MOBILE COMPACT TELEMETRY BADGES (< md) */}
      <div className="flex items-center gap-1 md:hidden">
        <Link
          href="/app/runs"
          title={`${openQuests} signals waiting for action`}
          className="flex items-center gap-1 border-2 border-black bg-[#FF5722] text-white px-1.5 py-0.5 text-[9px] font-black uppercase shadow-[1px_1px_0_0_#000]"
        >
          <Scroll className="size-2.5 shrink-0" strokeWidth={3} />
          <span>{openQuests}</span>
        </Link>

        <div className="flex items-center gap-1 border-2 border-black bg-[#06B6D4] text-white px-1.5 py-0.5 text-[9px] font-black uppercase shadow-[1px_1px_0_0_#000]">
          <Zap className="size-2.5 text-[#FFE600] animate-pulse shrink-0" strokeWidth={3} />
          <span>{currentMp}</span>
        </div>

        <div className="flex items-center gap-1 border-2 border-black bg-[#FFE600] text-black px-1.5 py-0.5 text-[9px] font-black uppercase shadow-[1px_1px_0_0_#000]">
          <Sparkles className="size-2.5 text-black shrink-0" strokeWidth={3} />
          <span>L{playerLevel}</span>
        </div>
      </div>

      {/* DESKTOP EXP & MP METERS (md+) */}
      <div className="hidden items-center gap-3 md:flex">
        <Link
          href="/app/runs"
          title={`${openQuests} signals waiting for action`}
          className="flex items-center gap-1.5 border-[3px] border-black bg-[#FF5722] text-white px-3 py-1.5 shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-transform"
        >
          <Scroll className="size-3.5 shrink-0" strokeWidth={3} />
          <span className="font-mono text-[11px] font-black uppercase tracking-wider">
            {openQuests} QUESTS
          </span>
        </Link>

        {/* EXP / Level Progress Bar */}
        <div
          title={`${playerXp} of ${xpRequired} XP toward level ${playerLevel + 1}`}
          className="flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#000]"
        >
          <div className="flex items-center gap-1">
            <Sparkles className="size-3.5 text-[#F59E0B]" strokeWidth={3} />
            <span className="border-2 border-black bg-[#FFE600] px-1.5 py-0.2 font-mono text-[9px] font-black uppercase text-black">
              LVL {playerLevel}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={`inline-block h-3 w-1.5 border border-black ${
                  i < activeXpSegments ? 'bg-[#FFE600]' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
            XP {playerXp.toLocaleString()}/{xpRequired.toLocaleString()}
          </span>
        </div>

        {/* MP / Mana Vault Meter */}
        <div
          title={`${currentMp} scan credits left — each scan costs 1 MP`}
          className="flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#000]"
        >
          <Zap aria-hidden="true" className="size-3.5 shrink-0 text-[#06B6D4] animate-pulse" strokeWidth={3} />
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={`inline-block h-3 w-1.5 border border-black ${
                  i < activeManaSegments ? 'bg-[#06B6D4]' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
            {currentMp}/{maxMp} MP
          </span>
        </div>

        {/* User Name Badge */}
        <div className="hidden lg:flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#000]">
          <div className="grid size-6 shrink-0 place-items-center border-2 border-black bg-[#FFD84D]">
            <User aria-hidden="true" className="size-3.5 text-black" strokeWidth={3} />
          </div>
          <span className="max-w-[8rem] truncate font-mono text-[11px] font-black uppercase tracking-wider text-black">
            {userName}
          </span>
        </div>
      </div>
    </>
  )
}
