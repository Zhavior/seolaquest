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
    <div className={`border-2 border-black px-3 py-2 ${tone}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-black/55">
        {label}
      </div>
      <div className="mt-1 text-base font-black text-black">
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
      className="border-2 border-black bg-[#F7F1DD] p-4 md:p-5"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border-2 border-black bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFE600]">
              Battle Area
            </span>
            <span className="border-2 border-black bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black">
              Mission Brief
            </span>
          </div>

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/50">
            Current Objective
          </p>

          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-black md:text-3xl">
            Continue Today&apos;s Campaign
          </h2>

          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-black/70">
            Review your highest priority leads, complete open quests, and push your guild toward today&apos;s objective.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatChip label="Reward" value="+240 XP" tone="bg-[#FFE082]" />
            <StatChip label="Mana" value="+15" tone="bg-[#B8FFF3]" />
          </div>
        </div>

        <div className="xl:w-[340px]">
          <div className="border-2 border-black bg-[#FFF6D8] p-3">
            <p className="border-b-2 border-black pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-black/55">
              Player Status
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatChip label="Level" value={user.level} tone="bg-[#FFF1A8]" />
              <StatChip label="XP" value={user.xp.toLocaleString()} tone="bg-[#D8FFF8]" />
              <StatChip label="Mana" value={maxCredits.toLocaleString()} tone="bg-[#FFD9B8]" />
              <StatChip label="Quests" value={remainingQuests} />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
