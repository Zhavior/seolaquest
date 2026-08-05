'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Swords, Radar, Shield, Sparkles, Zap, Scroll, Trophy, ArrowRight } from 'lucide-react'
import type { DashboardUser } from '@/features/dashboard/types'
import { sfx } from '@/lib/sfx'

type DashboardHeaderProps = {
  item: Variants
  user: DashboardUser
  remainingQuests: number
  maxCredits: number
  runMockScanner?: () => void
}

function StatChip({
  label,
  value,
  subtext,
  tone = 'bg-white',
}: {
  label: string
  value: string | number
  subtext?: string
  tone?: string
}) {
  return (
    <div className={`px-4 py-3 flex flex-col justify-center border-2 border-black ${tone} shadow-[2px_2px_0_0_#000]`}>
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-black/70">
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-black text-black leading-none">
        {value}
      </div>
      {subtext && (
        <div className="mt-1 text-[9px] font-mono font-bold text-black/60 uppercase">
          {subtext}
        </div>
      )}
    </div>
  )
}

export function DashboardHeader({
  item,
  user,
  remainingQuests,
  maxCredits,
  runMockScanner,
}: DashboardHeaderProps) {
  const currentXp = user.xp ?? 1250
  const xpRequired = user.xpRequired ?? 2000
  const xpPercent = Math.min(100, Math.round((currentXp / Math.max(1, xpRequired)) * 100))

  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      className="relative border-4 border-black bg-white shadow-[6px_6px_0_0_#000] md:shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row xl:items-stretch overflow-hidden select-none"
    >
      {/* Noise Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Campaign Hero Content */}
      <div className="relative z-10 min-w-0 flex-1 p-5 md:p-8 bg-[#FFF8D9] border-b-4 xl:border-b-0 xl:border-r-4 border-black flex flex-col justify-between">
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

          {/* XP Level Progress Bar Inside Campaign Card */}
          <div className="mt-5 max-w-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0_0_#000]">
            <div className="flex items-center justify-between text-xs font-black uppercase mb-1.5">
              <span className="flex items-center gap-1.5 text-black">
                <Sparkles className="size-3.5 text-[#F59E0B]" />
                Level Progress (LVL {user.level})
              </span>
              <span className="font-mono text-black">
                {currentXp.toLocaleString()} / {xpRequired.toLocaleString()} XP ({xpPercent}%)
              </span>
            </div>
            <div className="h-3.5 w-full border-2 border-black bg-slate-100 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#FFE600] via-[#F59E0B] to-[#A3E635] transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
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

      {/* Right Telemetry Column */}
      <div className="relative z-10 xl:w-[360px] bg-[#FFF6D8] flex flex-col justify-between p-4 space-y-4">
        <div className="p-3 border-3 border-black bg-[#FFE082] shadow-[3px_3px_0_0_#000] flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-black">
            PLAYER COMMAND TELEMETRY
          </p>
          <span className="size-2.5 rounded-full bg-[#00c951] animate-pulse border border-black" />
        </div>

        <div className="grid grid-cols-2 gap-2.5 flex-1">
          <StatChip
            label="Level"
            value={`LVL ${user.level}`}
            subtext="Hero Rank"
            tone="bg-[#FFF1A8]"
          />
          <StatChip
            label="EXP"
            value={`${currentXp.toLocaleString()}`}
            subtext={`Target ${xpRequired.toLocaleString()}`}
            tone="bg-[#FFE600]"
          />
          <StatChip
            label="Quests"
            value={remainingQuests}
            subtext="Active Bounties"
            tone="bg-[#FFD9B8]"
          />
          <StatChip
            label="Mana (MP)"
            value={`${maxCredits.toLocaleString()}`}
            subtext="Vault Capacity"
            tone="bg-[#06B6D4] text-white"
          />
        </div>

        <div className="p-3 border-3 border-black bg-white shadow-[3px_3px_0_0_#000] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black uppercase">
            <span className="flex items-center gap-1">
              <Zap className="size-3.5 text-[#06B6D4]" /> Daily Reward
            </span>
            <span className="text-[#16A34A]">+240 XP • +15 MP</span>
          </div>
          <p className="text-[10px] font-bold text-black/70 leading-normal">
            Completing daily scans unlocks bonus XP and restores mana vault credits.
          </p>
        </div>
      </div>
    </motion.section>
  )
}

export default DashboardHeader
