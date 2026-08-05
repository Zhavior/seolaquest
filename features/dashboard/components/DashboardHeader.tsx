'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Swords, Radar, Scroll, Trophy, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import type { DashboardUser } from '@/features/dashboard/types'
import { sfx } from '@/lib/sfx'

type DashboardHeaderProps = {
  item: Variants
  user: DashboardUser
  remainingQuests: number
  maxCredits: number
  runMockScanner?: () => void
}

export function DashboardHeader({
  item,
  remainingQuests,
  maxCredits,
  runMockScanner,
}: DashboardHeaderProps) {
  // The bar is a share of the account's own credit high-water mark, not a made-up
  // ceiling. A brand new account has no allocation yet, so it reads as empty.
  const maxQuests = maxCredits
  const questProgressPercent =
    maxQuests > 0 ? Math.min(100, Math.round((remainingQuests / maxQuests) * 100)) : 0

  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      className="relative border-4 border-outline bg-card shadow-brutal sm:shadow-brutal-lg md:shadow-brutal-lg flex flex-col lg:flex-row lg:items-stretch overflow-hidden select-none w-full min-w-0"
    >
      {/* Noise Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Campaign Hero Content */}
      <div className="relative z-10 min-w-0 flex-1 p-4 sm:p-6 md:p-8 bg-highlight border-b-4 lg:border-b-0 lg:border-r-4 border-outline flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="bg-black px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#FFE600] border-2 border-outline shadow-brutal-sm -rotate-1 flex items-center gap-1.5">
              <Swords className="size-3.5" />
              <span>BATTLE COMMAND</span>
            </span>
            <span className="bg-card px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-ink border-2 border-outline shadow-brutal-sm flex items-center gap-1.5">
              <Trophy className="size-3.5 text-[#F59E0B]" />
              <span>DAILY CAMPAIGN</span>
            </span>
            <span className="bg-success text-on-accent px-2 py-1 text-[10px] font-black uppercase border-2 border-outline shadow-brutal-sm rotate-1 hidden sm:inline-block">
              ACTIVE STREAK ⚡
            </span>
          </div>

          <p className="mt-4 sm:mt-5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-ink/60">
            Current Primary Objective
          </p>

          <h2 className="mt-1 text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tight text-ink leading-none break-words">
            Continue Today&apos;s Campaign
          </h2>

          <p className="mt-3 sm:mt-3.5 max-w-2xl text-xs sm:text-sm md:text-base font-bold leading-relaxed text-ink/80">
            Sweep your high-priority Reddit and Twitter streams, execute active bounties, and claim verified source matches to push your level forward today.
          </p>
        </div>

        {/* Action Button Cluster - Responsive Mobile Stack */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            href="/app/runs"
            onMouseEnter={() => sfx.playSidebarHover()}
            onClick={() => sfx.playCoinDrop()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-3 border-outline bg-accent px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider text-on-accent shadow-brutal-sm sm:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 transition-all"
          >
            <Swords className="size-4 shrink-0" strokeWidth={3} />
            <span>EXECUTE QUESTS</span>
            <ArrowRight className="size-4 shrink-0" />
          </Link>

          {runMockScanner && (
            <button
              type="button"
              onClick={runMockScanner}
              onMouseEnter={() => sfx.playSidebarHover()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-3 border-outline bg-info px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider text-white shadow-brutal-sm sm:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 transition-all"
            >
              <Radar className="size-4 shrink-0 animate-spin" style={{ animationDuration: '4s' }} strokeWidth={3} />
              <span>RADAR SCAN</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sfx.playCoinDrop()
              const el = document.getElementById('battle-ready-signals')
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
              }
            }}
            onMouseEnter={() => sfx.playSidebarHover()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-3 border-outline bg-card px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider text-ink shadow-brutal-sm sm:shadow-brutal hover:bg-canvas hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 transition-all"
          >
            <Scroll className="size-4 shrink-0" strokeWidth={3} />
            <span>BATTLE SIGNALS</span>
          </button>
        </div>
      </div>

      {/* Upgraded Quest Counter & Capacity Box */}
      <div className="relative z-10 w-full lg:w-[380px] bg-accent-2 p-4 sm:p-6 text-white flex flex-col justify-between border-t-4 lg:border-t-0 border-outline shadow-[inset_0_0_30px_rgba(0,0,0,0.15)] min-w-0">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="bg-black text-[#FFE600] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-2 border-white shadow-brutal-sm truncate">
              ACTIVE QUEST TRACKER
            </span>
            <Scroll className="size-5 sm:size-6 text-[#FFE600] animate-bounce shrink-0" style={{ animationDuration: '3s' }} />
          </div>

          <div className="mt-3.5 sm:mt-4">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.14em] text-white/80">
              Quests Available Today
            </p>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-4xl sm:text-5xl font-black text-[#FFE600] tracking-tight leading-none drop-shadow-brutal-sm">
                {remainingQuests}
              </span>
              <span className="text-base sm:text-lg font-black uppercase text-white/90">
                / {maxQuests} QUESTS READY
              </span>
            </div>
          </div>

          {/* Upgraded Quest Capacity Progress Bar */}
          <div className="mt-3.5 sm:mt-4 border-3 border-outline bg-black p-2 sm:p-2.5 shadow-brutal-sm">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black uppercase text-[#FFE600] mb-1.5">
              <span>Quest Ready Capacity</span>
              <span>{questProgressPercent}%</span>
            </div>
            <div className="h-3 sm:h-3.5 w-full border-2 border-white bg-slate-900 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#FFE600] via-[#A3E635] to-[#06B6D4] transition-all duration-500"
                style={{ width: `${questProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* High-Octane Quest Perks */}
        <div className="mt-4 sm:mt-5 space-y-2 text-[11px] sm:text-xs font-black uppercase text-white">
          <div className="flex items-center gap-2 border-2 border-outline bg-black/40 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-brutal-sm">
            <CheckCircle2 className="size-3.5 sm:size-4 text-[#A3E635] shrink-0" />
            <span className="truncate">High-Priority Buyer Signals Armed</span>
          </div>
          <div className="flex items-center gap-2 border-2 border-outline bg-black/40 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-brutal-sm">
            <Sparkles className="size-3.5 sm:size-4 text-[#FFE600] shrink-0" />
            <span className="truncate">+240 XP Bonus on Complete Claim</span>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default DashboardHeader
