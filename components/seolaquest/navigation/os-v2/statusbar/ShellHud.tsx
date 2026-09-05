import Link from 'next/link'
import { Scroll, Sparkles, User, Zap } from 'lucide-react'

import type { ShellUser } from '@/lib/shellUser'

/** Notches in the EXP and MP meters — segments, not a smooth bar. */
const METER_SEGMENTS = 8

function segmentsFor(value: number, ceiling: number) {
  if (ceiling <= 0) return 0
  return Math.round((Math.min(value, ceiling) / ceiling) * METER_SEGMENTS)
}

/**
 * A meter is a picture of the number the pill already states in text beside it,
 * so it is hidden from assistive tech rather than read out twice. It also drops
 * below `lg`, where the pills have to share the bar with the name badge.
 */
function Meter({ filled, fillClass }: { filled: number; fillClass: string }) {
  return (
    <div aria-hidden="true" className="hidden items-center gap-0.5 lg:flex">
      {Array.from({ length: METER_SEGMENTS }).map((_, index) => (
        <span
          key={index}
          className={`inline-block h-2.5 w-1 border border-outline ${
            index < filled ? fillClass : 'bg-inset'
          }`}
        />
      ))}
    </div>
  )
}

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

  // Signals still waiting in the queue. Zero is a state worth showing, not a
  // reason to hide the counter: an empty board is information.
  //
  // This counts leads, so it links to the Battle Area where leads are worked —
  // not to the Quest Board, which counts something else entirely. It used to
  // point at the scan-run ledger, which counted nothing this pill mentions.
  const openQuests = user?.openQuests ?? 0

  // Each reading is one string rather than nested spans. Split across elements a
  // meter reads as "18" then "/50" to anything walking the DOM — a screen reader
  // included — and the number the user sees stops being a number anyone can
  // assert on.
  const questLabel = `${openQuests} QUESTS`
  const xpLabel = `XP ${playerXp.toLocaleString()}/${xpRequired.toLocaleString()}`
  const mpLabel = `${currentMp}/${maxMp} MP`
  const levelLabel = `LVL ${playerLevel}`

  return (
    <>
      {/* MOBILE: numbers only — there is no room for the words */}
      <div className="flex items-center gap-1 md:hidden">
        <Link
          href="/app"
          aria-label={questLabel}
          title={`${openQuests} signals waiting for action`}
          className="flex h-9 items-center gap-1 rounded-lg border border-outline bg-accent-2 px-2 text-[9px] font-semibold normal-case text-on-accent shadow-none"
        >
          <Scroll aria-hidden="true" className="size-2.5 shrink-0" strokeWidth={1.75} />
          <span>{openQuests}</span>
        </Link>

        {/*
          `role="img"` so the abbreviated reading is announced in full: a generic
          div cannot carry an accessible name, and "18/50" on its own says
          nothing about what is being counted.
        */}
        <div
          role="img"
          aria-label={mpLabel}
          className="flex h-9 items-center gap-1 rounded-lg border border-outline bg-card px-2 text-[9px] font-semibold normal-case shadow-none"
        >
          <Zap aria-hidden="true" className="size-2.5 shrink-0 text-[#06B6D4] animate-pulse" strokeWidth={1.75} />
          <span>{`${currentMp}/${maxMp}`}</span>
        </div>

        <div
          role="img"
          aria-label={levelLabel}
          className="flex h-9 items-center rounded-lg border border-outline bg-highlight-strong px-2 font-mono text-[9px] font-semibold normal-case text-on-accent shadow-none"
        >
          {`L${playerLevel}`}
        </div>
      </div>

      {/*
        DESKTOP: compact pills, revealed in the order the bar can afford them.
        The status bar also carries the brand, the sound toggle and the recharge
        CTA, so from `md` a pill shows its label, from `lg` its meter, and only
        from `xl` its raw numbers — anything eagerer clips the CTA.
      */}
      <div className="hidden items-center gap-1.5 md:flex">

        {/* Quests waiting */}
        <Link
          href="/app"
          title={`${openQuests} signals waiting for action`}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-outline bg-accent-2 px-2.5 text-[11px] font-semibold normal-case tracking-normal text-on-accent shadow-none transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:shadow-none"
        >
          <Scroll aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
          <span>{questLabel}</span>
        </Link>

        {/* EXP toward the next level */}
        <div
          title={`${playerXp} of ${xpRequired} XP toward level ${playerLevel + 1}`}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-outline bg-card px-2.5 text-[11px] font-semibold normal-case tracking-normal shadow-none"
        >
          <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-warning" strokeWidth={1.75} />
          <span className="rounded-lg border border-outline bg-highlight-strong px-1 font-mono text-[9px] font-semibold text-on-accent">
            {levelLabel}
          </span>
          <Meter filled={segmentsFor(playerXp, xpRequired)} fillClass="bg-accent" />
          <span className="hidden font-mono text-[10px] text-ink xl:inline">{xpLabel}</span>
        </div>

        {/* MP / scan credits */}
        <div
          title={`${currentMp} scan credits — each scan costs 1 MP`}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-outline bg-card px-2.5 text-[11px] font-semibold normal-case tracking-normal shadow-none"
        >
          <Zap aria-hidden="true" className="size-3.5 shrink-0 text-[#06B6D4] animate-pulse" strokeWidth={1.75} />
          <Meter filled={segmentsFor(currentMp, maxMp)} fillClass="bg-info" />
          <span className="text-ink">{mpLabel}</span>
        </div>

        {/* User name badge */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-outline bg-card px-2.5 h-9 shadow-none">
          <div className="grid size-5 shrink-0 place-items-center rounded-lg border border-outline bg-highlight-strong">
            <User aria-hidden="true" className="size-3 text-on-accent" strokeWidth={1.75} />
          </div>
          <span className="max-w-[8rem] truncate font-mono text-[11px] font-semibold normal-case tracking-normal text-ink">
            {userName}
          </span>
        </div>
      </div>
    </>
  )
}
