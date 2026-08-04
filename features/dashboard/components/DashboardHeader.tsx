import { motion, type Variants } from 'framer-motion'
import type { DashboardUser } from '@/features/dashboard/types'
import HQCard from '@/components/coquest/ui/HQCard'
import HQStat from '@/components/coquest/ui/HQStat'

type DashboardHeaderProps = {
  item: Variants
  user: DashboardUser
  remainingQuests: number
  maxCredits: number
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
      className="relative overflow-hidden border-4 border-black bg-[#F7F1DD] p-5 shadow-[8px_8px_0_0_#000] md:p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,214,10,0.08),_transparent_30%)]" />
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-4 border-black/15 bg-[#14D9C4]/10" />
      <div className="absolute -bottom-10 left-8 h-24 w-24 rotate-12 border-4 border-black/10 bg-[#14D9C4]/8" />

      <HQCard
        variant="mission"
        className="relative border-0 bg-transparent p-0 shadow-none"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border-4 border-black bg-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE600] shadow-[4px_4px_0_0_#000]">
              Battle Area
            </span>
            <span className="border-4 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[4px_4px_0_0_#000]">
              Mission Brief
            </span>
          </div>

          <div className="mt-5 border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">

            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/50">
              CURRENT OBJECTIVE
            </p>

            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">
              Continue Today's Campaign
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-bold text-black/70">
              Review your highest priority leads, complete open quests,
              and push your guild toward today's objective.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">

              <div className="border-4 border-black bg-[#FFE082] px-4 py-2 shadow-[4px_4px_0_0_#000]">
                <div className="text-[10px] font-black uppercase tracking-[0.18em]">
                  Reward
                </div>

                <div className="mt-1 text-lg font-black">
                  +240 XP
                </div>
              </div>

              <div className="border-4 border-black bg-[#B8FFF3] px-4 py-2 shadow-[4px_4px_0_0_#000]">
                <div className="text-[10px] font-black uppercase tracking-[0.18em]">
                  Mana
                </div>

                <div className="mt-1 text-lg font-black">
                  +15
                </div>
              </div>

            </div>

          </div>
        </div>

        
<div className="rounded-none border-4 border-black bg-[#FFF6D8] p-4 shadow-[8px_8px_0_0_#000]">
  <div className="mb-4 border-b-4 border-black pb-2">
    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/60">
      PLAYER STATUS
    </p>
  </div>

  <div className="grid gap-3 md:grid-cols-2">

  <HQStat
    label="Level"
    value={user.level}
    accent="gold"
  />

  <HQStat
    label="XP"
    value={user.xp.toLocaleString()}
    accent="turquoise"
  />

  <HQStat
    label="Mana"
    value={maxCredits.toLocaleString()}
    accent="orange"
  />

  <HQStat
    label="Quests"
    value={remainingQuests}
  />

</div>
</div>
      </div>
    </HQCard>

    </motion.section>
  )
}
