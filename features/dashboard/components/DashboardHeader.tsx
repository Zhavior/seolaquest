import { motion, type Variants } from 'framer-motion'
import { Crosshair, Radar, Sparkles, ShieldAlert } from 'lucide-react'
import type { DashboardUser } from '@/features/dashboard/types'

type DashboardHeaderProps = {
  item: Variants
  subscriptionTier: string
  characterTitle: string
  user: DashboardUser
  remainingQuests: number
  maxCredits: number
  setIsManaShopOpen: (open: boolean) => void
}

export function DashboardHeader({
  item,
  subscriptionTier,
  characterTitle,
  user,
  remainingQuests,
}: DashboardHeaderProps) {
  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden border-4 border-black bg-[#14D9C4] p-5 shadow-[8px_8px_0_0_#000] md:p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.26),_transparent_34%),linear-gradient(135deg,_rgba(10,23,33,0.08),_transparent_58%)]" />
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-4 border-black/15 bg-white/10" />
      <div className="absolute -bottom-10 left-8 h-24 w-24 rotate-12 border-4 border-black/10 bg-black/5" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border-4 border-black bg-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE600] shadow-[4px_4px_0_0_#000]">
              Battlestation live command
            </span>
            <span className="border-4 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[4px_4px_0_0_#000]">
              /app tactical surface
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.03em] text-black md:text-4xl">
            Command live scans before the trail goes cold
          </h2>

          <p className="mt-3 max-w-2xl text-sm font-bold uppercase tracking-[0.04em] text-black/75 md:text-[15px]">
            Ready the radar, track active signal pressure, and turn fresh matches into actions while the board is still hot.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
          <div className="border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
              Hunter title
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-black">
              {characterTitle}
            </p>
          </div>

          <div className="border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
              Open objectives
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-black">
              {remainingQuests} live quests
            </p>
          </div>

          <div className="border-4 border-black bg-[#FFF8CC] px-4 py-3 shadow-[4px_4px_0_0_#000]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
              Scan mode
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-black">
              <Radar className="h-4 w-4" />
              High-alert patrol
            </p>
          </div>

          <div className="border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
              Command state
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-black">
              <ShieldAlert className="h-4 w-4" />
              {subscriptionTier}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
