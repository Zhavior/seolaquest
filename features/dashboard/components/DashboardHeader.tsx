import { motion, Variants } from 'framer-motion'
import AudioNavbarToggle from '@/components/AudioNavbarToggle'
import ManaLiquidMeter from '@/components/ManaLiquidMeter'
import { DashboardUser } from '@/features/dashboard/types'

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
  maxCredits,
  setIsManaShopOpen
}: DashboardHeaderProps) {
  return (
    <motion.div variants={item} className="space-y-4">
      <div className="bg-black text-white border-4 border-black p-4 flex flex-wrap items-center justify-between gap-4 shadow-[6px_6px_0px_0px_rgba(255,230,0,1)]">
        <div className="flex items-center gap-4">
          <span className="bg-[#FF5722] text-white font-black text-sm uppercase px-3 py-1 border-2 border-white shadow-[2px_2px_0_0_#fff]">
            {subscriptionTier}
          </span>
          <span className="font-black text-base uppercase">
            <span className="text-[#06B6D4]">{characterTitle}</span> ({user.name})
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <AudioNavbarToggle />
        </div>
      </div>

      <ManaLiquidMeter
        currentMana={remainingQuests}
        maxMana={Math.max(1, maxCredits)}
        onOpenShop={() => setIsManaShopOpen(true)}
      />
    </motion.div>
  )
}
