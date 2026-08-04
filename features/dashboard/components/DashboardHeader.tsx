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
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-black/60">
        {label}
      </div>
      <div className="mt-1 text-xl font-black text-black">
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
      className="border-2 border-black bg-[#F7F1DD] shadow-[4px_4px_0_#000] flex flex-col xl:flex-row xl:items-stretch divide-y-2 divide-black xl:divide-y-0 xl:divide-x-2"
    >
      <div className="min-w-0 flex-1 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFE600] shadow-[2px_2px_0_#000]">
            Battle Area
          </span>
          <span className="bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-black shadow-[2px_2px_0_#000]">
            Mission Brief
          </span>
        </div>

        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.2em] text-black/50">
          Current Objective
        </p>

        <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.5rem)] font-black uppercase tracking-tight text-black leading-none">
          Continue Today&apos;s Campaign
        </h2>

        <p className="mt-4 max-w-2xl text-[clamp(0.875rem,1.5vw,1rem)] font-bold leading-relaxed text-black/70">
          Review your highest priority leads, complete open quests, and push your guild toward today&apos;s objective.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-3 bg-[#FFE082] px-4 py-2 shadow-[2px_2px_0_#000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-black/60">Reward</span>
            <span className="text-sm font-black text-black">+240 XP</span>
          </div>
          <div className="flex items-center gap-3 bg-[#B8FFF3] px-4 py-2 shadow-[2px_2px_0_#000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-black/60">Mana</span>
            <span className="text-sm font-black text-black">+15</span>
          </div>
        </div>
      </div>

      <div className="xl:w-[380px] bg-[#FFF6D8] flex flex-col">
        <div className="p-4 border-b-2 border-black bg-[#FFE082]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/70">
            Player Status
          </p>
        </div>

        <div className="grid grid-cols-2 flex-1 bg-black gap-[2px]">
          <StatChip label="Level" value={user.level} tone="bg-[#FFF1A8]" />
          <StatChip label="XP" value={user.xp.toLocaleString()} tone="bg-[#D8FFF8]" />
          <StatChip label="Mana" value={maxCredits.toLocaleString()} tone="bg-[#FFD9B8]" />
          <StatChip label="Quests" value={remainingQuests} tone="bg-white" />
        </div>
      </div>
    </motion.section>
  )
}
