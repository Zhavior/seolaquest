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
  runMockScanner,
}: DashboardHeaderProps) {
  const maxQuests = 15
  const questProgressPercent = Math.min(100, Math.round((remainingQuests / maxQuests) * 100))

  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      className="relative border-4 border-black bg-white shadow-[6px_6px_0_0_#000] md:shadow-[8px_8px_0_0_#000] flex flex-col lg:flex-row lg:items-stretch overflow-hidden select-none"
    >
      {/* Noise Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Campaign Hero Content */}
      <div className="relative z-10 min-w-0 flex-1 p-5 md:p-8 bg-[#FFF8D9] border-b-4 lg:border-b-0 lg:border-r-4 border-black flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-[#FFE600] border-2 border-black shadow-[2px_2px_0_0_#000] -rotate-1 flex items-center gap-1.5">
              <Swords className="size-3.5" />
              <span>BATTLE COMMAND</span>
            </span>
            <span className="bg-white px-3 py-1 text-xs font-black uppercase tracking-widest text-black border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Trophy className="size-3.5 text-[#F59E0B]" />
              <span>DAILY CAMPAIGN</span>
            </span>
            <span className="bg-[#A3E635] text-black px-2.5 py-1 text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] rotate-1 hidden sm:inline-block">
              ACTIVE STREAK ⚡
            </span>
          </div>

          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-black/60">
            Current Primary Objective
          </p>

          <h2 className="mt-1 text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tight text-black leading-none">
            Continue Today&apos;s Campaign
          </h2>

          <p className="mt-3.5 max-w-2xl text-xs sm:text-sm md:text-base font-bold leading-relaxed text-black/80">
            Sweep your high-priority Reddit and Twitter streams, execute active bounties, and claim verified source matches to push your level forward today.
          </p>
        </div>

        {/* Action Button Cluster */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/app/runs"
            onMouseEnter={() => sfx.playSidebarHover()}
            onClick={() => sfx.playCoinDrop()}
            className="inline-flex items-center gap-2 border-3 border-black bg-[#FFE600] px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0 active:translate-y-0 transition-all"
          >
            <Swords className="size-4" strokeWidth={3} />
            <span>EXECUTE QUESTS</span>
            <ArrowRight className="size-4" />
          </Link>

          {runMockScanner && (
            <button
              type="button"
              onClick={runMockScanner}
              onMouseEnter={() => sfx.playSidebarHover()}
              className="inline-flex items-center gap-2 border-3 border-black bg-[#06B6D4] px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider text-white shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0 active:translate-y-0 transition-all"
            >
              <Radar className="size-4 animate-spin" style={{ animationDuration: '4s' }} strokeWidth={3} />
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
            className="inline-flex items-center gap-2 border-3 border-black bg-white px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0_0_#000] hover:bg-[#FAF7F2] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0 active:translate-y-0 transition-all"
          >
            <Scroll className="size-4" strokeWidth={3} />
            <span>BATTLE SIGNALS</span>
          </button>
        </div>
      </div>

      {/* Upgraded Quest Counter & Capacity Box */}
      <div className="relative z-10 lg:w-[380px] bg-[#FF5722] p-6 text-white flex flex-col justify-between border-t-4 lg:border-t-0 border-black shadow-[inset_0_0_30px_rgba(0,0,0,0.15)]">
        <div>
          <div className="flex items-center justify-between">
            <span className="bg-black text-[#FFE600] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-2 border-white shadow-[2px_2px_0_0_#000]">
              ACTIVE QUEST TRACKER
            </span>
            <Scroll className="size-6 text-[#FFE600] animate-bounce" style={{ animationDuration: '3s' }} />
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/80">
              Quests Available Today
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-black text-[#FFE600] tracking-tight leading-none drop-shadow-[3px_3px_0_#000]">
                {remainingQuests}
              </span>
              <span className="text-lg font-black uppercase text-white/90">
                / {maxQuests} QUESTS READY
              </span>
            </div>
          </div>

          {/* Upgraded Quest Capacity Progress Bar */}
          <div className="mt-4 border-3 border-black bg-black p-2.5 shadow-[3px_3px_0_0_#000]">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-[#FFE600] mb-1.5">
              <span>Quest Ready Capacity</span>
              <span>{questProgressPercent}%</span>
            </div>
            <div className="h-3.5 w-full border-2 border-white bg-slate-900 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#FFE600] via-[#A3E635] to-[#06B6D4] transition-all duration-500"
                style={{ width: `${questProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* High-Octane Quest Perks */}
        <div className="mt-5 space-y-2 text-xs font-black uppercase text-white">
          <div className="flex items-center gap-2 border-2 border-black bg-black/40 px-3 py-2 shadow-[2px_2px_0_0_#000]">
            <CheckCircle2 className="size-4 text-[#A3E635] shrink-0" />
            <span>High-Priority Buyer Signals Armed</span>
          </div>
          <div className="flex items-center gap-2 border-2 border-black bg-black/40 px-3 py-2 shadow-[2px_2px_0_0_#000]">
            <Sparkles className="size-4 text-[#FFE600] shrink-0" />
            <span>+240 XP Bonus on Complete Claim</span>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default DashboardHeader
