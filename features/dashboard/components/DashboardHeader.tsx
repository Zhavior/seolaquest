import { motion, type Variants } from 'framer-motion'
import { Crosshair, Sparkles } from 'lucide-react'
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
      className="border-4 border-black bg-[#FFE600] p-5 shadow-[6px_6px_0_0_#000] md:p-6"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/60">
            Guild Hall command
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-black md:text-3xl">
            Hunt high-intent signals before they go cold
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-bold uppercase tracking-[0.04em] text-black/75">
            Operate your headquarters, dispatch scans, and convert live matches into active opportunities.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
              Current title
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-black">
              {characterTitle}
            </p>
          </div>

          <div className="border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
              Quest load
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-black">
              {remainingQuests} open objectives
            </p>
          </div>

          <div className="border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
              Signal mode
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-black">
              <Crosshair className="h-4 w-4" />
              Live patrol
            </p>
          </div>

          <div className="border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
              Guild state
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-black">
              <Sparkles className="h-4 w-4" />
              {subscriptionTier}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
