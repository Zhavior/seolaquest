'use client'

import { motion, type Variants } from 'framer-motion'
import type { DashboardUser } from '@/features/dashboard/types'

type DashboardHeaderProps = {
  item: Variants
  user: DashboardUser
  remainingQuests: number
  maxCredits: number
}

function StatChip({
  label,
  value,
  tone = 'bg-white',
}: {
  label: string
  value: string | number
  tone?: string
}) {
  return (
    <div className={`px-4 py-3 flex flex-col justify-center ${tone}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-black/70">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-black">
        {value}
      </div>
    </div>
  )
}

export function DashboardHeader({
  item,
  user,
  remainingQuests,
  maxCredits,
}: DashboardHeaderProps) {
  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] flex flex-col xl:flex-row xl:items-stretch divide-y-4 divide-black xl:divide-y-0 xl:divide-x-4"
    >
      <div className="min-w-0 flex-1 p-6 md:p-8 bg-[#FFF8D9]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-[#FFE600] border-2 border-black shadow-[2px_2px_0_#000] -rotate-1">
            BATTLE AREA
          </span>
          <span className="bg-white px-3 py-1 text-xs font-black uppercase tracking-widest text-black border-2 border-black shadow-[2px_2px_0_#000]">
            MISSION BRIEF
          </span>
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-black/60">
          Current Objective
        </p>

        <h2 className="mt-2 text-3xl md:text-4xl font-black uppercase tracking-tight text-black leading-none">
          Continue Today&apos;s Campaign
        </h2>

        <p className="mt-4 max-w-2xl text-base md:text-lg font-bold leading-relaxed text-black/80">
          Review your highest priority leads, complete open quests, and push your guild toward today&apos;s objective.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-3 bg-[#FFE082] px-4 py-2 border-2 border-black shadow-[3px_3px_0_#000]">
            <span className="text-xs font-black uppercase tracking-wider text-black/70">Reward</span>
            <span className="text-base font-black text-black">+240 XP</span>
          </div>
          <div className="flex items-center gap-3 bg-[#06B6D4] px-4 py-2 border-2 border-black shadow-[3px_3px_0_#000]">
            <span className="text-xs font-black uppercase tracking-wider text-black/70">Mana</span>
            <span className="text-base font-black text-black">+15</span>
          </div>
        </div>
      </div>

      <div className="xl:w-[380px] bg-[#FFF6D8] flex flex-col border-t-4 xl:border-t-0 border-black">
        <div className="p-4 border-b-4 border-black bg-[#FFE082]">
          <p className="text-xs font-black uppercase tracking-widest text-black">
            PLAYER COMMAND TELEMETRY
          </p>
        </div>

        <div className="grid grid-cols-2 flex-1 bg-black gap-[3px]">
          <StatChip label="Level" value={user.level} tone="bg-[#FFF1A8]" />
          <StatChip label="XP" value={user.xp.toLocaleString()} tone="bg-[#D8FFF8]" />
          <StatChip label="Mana" value={maxCredits.toLocaleString()} tone="bg-[#FFD9B8]" />
          <StatChip label="Quests" value={remainingQuests} tone="bg-white" />
        </div>
      </div>
    </motion.section>
  )
}

export default DashboardHeader
