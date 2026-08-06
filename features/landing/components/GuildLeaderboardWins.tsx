'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LockKeyhole, Skull, Trophy, X } from 'lucide-react'
import { sfx } from '@/lib/sfx'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
type BossRecord = {
  id: string
  name: string
  lore: string
  lock: string
  hpLabel: string
  hpValue: string
  hpPercent: number
  dropSchema: Record<string, unknown>
}

const BOSSES: BossRecord[] = [
  {
    id: 'outcomes',
    name: 'BOSS: Proof of Outcomes',
    lore: 'Verified customer case studies. Defeating this boss requires 5 confirmed, real-world wins logged and validated.',
    lock: 'Lair sealed — Boss not yet defeated',
    hpLabel: 'Case studies defeated',
    hpValue: '0 / 5',
    hpPercent: 0,
    dropSchema: {
      type: 'case_study',
      verified: false,
      headline: null,
      outcome_metric: null,
      customer_class: null,
      published_at: null,
    },
  },
  {
    id: 'benchmarks',
    name: 'BOSS: Performance Benchmarks',
    lore: 'Revenue, conversion-rate, and response-time claims. Requires real production evidence reviewed by an independent source.',
    lock: 'Lair sealed — Evidence not yet compiled',
    hpLabel: 'Benchmarks defeated',
    hpValue: '0 / 3',
    hpPercent: 0,
    dropSchema: {
      type: 'benchmark',
      verified: false,
      metric_name: null,
      baseline_value: null,
      measured_value: null,
      timeframe_days: null,
    },
  },
  {
    id: 'leaderboard',
    name: 'BOSS: Public Leaderboard',
    lore: 'Guild activity made public. Requires an explicit public opt-in system shipped and a full privacy review cleared.',
    lock: 'Lair sealed — Privacy rules pending',
    hpLabel: 'Public modes released',
    hpValue: '0 / 1',
    hpPercent: 0,
    dropSchema: {
      type: 'leaderboard_entry',
      verified: false,
      guild_name: null,
      signals_captured: null,
      public_opt_in: false,
      last_active_epoch: null,
    },
  },
]

// ---------------------------------------------------------------------------
// Inspect <dialog> — native HTML, no library. Backdrop click or ✕ closes it.
// ---------------------------------------------------------------------------
function InspectDialog({
  boss,
  dialogRef,
  onClose,
}: {
  boss: BossRecord | null
  dialogRef: { current: HTMLDialogElement | null }
  onClose: () => void
}) {
  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Clicking the ::backdrop fires a click on the <dialog> element itself
        if (e.target === dialogRef.current) onClose()
      }}
      className="m-auto w-full max-w-lg border-4 border-outline bg-canvas p-0 shadow-[8px_8px_0_0_#000] backdrop:bg-black/70"
    >
      {boss && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b-4 border-outline bg-black px-5 py-4">
            <div>
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFE600]">
                ⚔ Inspect Boss Drops
              </p>
              <p className="mt-0.5 text-sm font-black uppercase text-white">{boss.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-outline bg-card text-ink shadow-brutal-sm transition-all duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-ink-muted">
              Drop schema — what this evidence record will contain when unlocked:
            </p>

            <pre className="overflow-x-auto border-4 border-outline bg-black p-4 font-mono text-[11px] leading-relaxed text-[#00ff95] shadow-brutal">
              {JSON.stringify(boss.dropSchema, null, 2)}
            </pre>

            <p className="mt-4 text-xs font-bold leading-relaxed text-ink-muted">
              All fields are{' '}
              <code className="border border-outline bg-inset px-1 font-mono text-[10px]">null</code>{' '}
              until evidence is collected, validated, and signed off. No fabricated data will
              ever appear here.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 flex w-full items-center justify-center border-4 border-outline bg-accent px-4 py-3 font-black uppercase tracking-[0.14em] text-on-accent shadow-brutal transition-all duration-75 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none"
            >
              Close dungeon gate
            </button>
          </div>
        </>
      )}
    </dialog>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function GuildLeaderboardWins() {
  const [activeBoss, setActiveBoss] = useState<BossRecord | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (activeBoss !== null) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [activeBoss])

  const openBoss = (boss: BossRecord) => {
    sfx.playBountyUnlock()
    setActiveBoss(boss)
  }

  const closeBoss = () => {
    sfx.playCoinDrop()
    setActiveBoss(null)
  }

  return (
    <section
      className="relative z-10 mx-auto my-12 max-w-7xl px-4 pb-8 sm:px-6"
      aria-labelledby="evidence-heading"
    >
      <InspectDialog boss={activeBoss} dialogRef={dialogRef} onClose={closeBoss} />

      {/* Section header */}
      <div className="mb-8 flex items-start gap-3">
        <div className="border-3 border-outline bg-highlight p-2 shadow-brutal-sm">
          <Trophy size={28} className="text-on-accent" />
        </div>
        <div>
          <h2 id="evidence-heading" className="text-3xl font-black uppercase text-ink sm:text-4xl">
            Evidence before big claims
          </h2>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ink-muted">
            Dungeon status — defeat bosses to unlock proof
          </p>
        </div>
      </div>

      {/* Boss cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {BOSSES.map((boss) => (
          <article
            key={boss.id}
            className="flex h-full flex-col justify-between border-4 border-outline bg-card p-6 shadow-brutal"
          >
            <div>
              {/* Boss name + icon */}
              <div className="mb-4 flex items-center gap-3">
                <div className="border-2 border-outline bg-black p-2 shadow-brutal-sm">
                  <Skull className="h-5 w-5 text-[#FFE600]" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-black uppercase leading-tight text-ink">
                  {boss.name}
                </h3>
              </div>

              <p className="font-bold leading-relaxed text-ink-muted">{boss.lore}</p>

              {/* HP bar */}
              <div className="mt-5 border-3 border-outline bg-[#f7f1e8] p-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-ink sm:text-[11px]">
                  <span>{boss.hpLabel}</span>
                  <span>{boss.hpValue}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono text-[9px] font-black uppercase text-ink-muted">
                    HP
                  </span>
                  <div className="h-4 flex-1 border-2 border-outline bg-card">
                    <div
                      className="h-full bg-accent-2"
                      style={{ width: `${boss.hpPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Inspect CTA */}
              <button
                type="button"
                onClick={() => openBoss(boss)}
                className="mt-4 flex w-full items-center justify-center gap-2 border-3 border-outline bg-black px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#FFE600] shadow-brutal-sm transition-all duration-75 hover:-translate-y-0.5 hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none"
              >
                <Skull className="h-3.5 w-3.5" aria-hidden="true" />
                Inspect Boss Drops
              </button>
            </div>

            {/* Status footer */}
            <div className="mt-6 flex items-center gap-2 border-t-2 border-outline pt-3 text-xs font-black uppercase tracking-[0.12em] text-ink">
              <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{boss.lock}</span>
            </div>
          </article>
        ))}
      </div>

      {/* CTA banner */}
      <div className="mt-12 border-4 border-outline bg-black px-6 py-10 text-center text-white shadow-[8px_8px_0_0_#ff5a36] sm:px-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFE600]">
          Start researching
        </p>
        <h3 className="mt-4 text-3xl font-black uppercase leading-none sm:text-5xl">
          Ready to review your first signal?
        </h3>
        <p className="mx-auto mt-4 max-w-2xl text-base font-bold text-white/85 sm:text-lg">
          Get 50 mana free. No credit card required.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center border-4 border-outline bg-accent px-8 py-4 text-lg font-black uppercase tracking-[0.14em] text-on-accent shadow-[6px_6px_0_0_#ff5a36] transition-all duration-75 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_#ff5a36] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-10 sm:text-xl"
          >
            Start your first scan
          </Link>
        </div>
      </div>
    </section>
  )
}
