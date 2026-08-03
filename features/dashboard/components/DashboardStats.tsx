import { motion, Variants } from 'framer-motion'
import { Share2, Crown } from 'lucide-react'
import HeroCrest from '@/components/HeroCrest'
import { DashboardUser, DashboardLead } from '@/features/dashboard/types'

type DashboardStatsProps = {
  item: Variants
  user: DashboardUser
  characterTitle: string
  isScanning: boolean
  recentLevelUp: boolean
  xpPercent: number
  leads: DashboardLead[]
  shareStats: () => void
}

export function DashboardStats({
  item,
  user,
  characterTitle,
  isScanning,
  recentLevelUp,
  xpPercent,
  leads,
  shareStats
}: DashboardStatsProps) {
  return (
    <motion.div variants={item} className="xl:col-span-8 bg-[#FFE600] border-4 border-black p-8 md:p-10 shadow-[8px_8px_0_0_#000] flex flex-col justify-between relative group overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
        <div className="flex-1">
          <div className="mb-6">
            <HeroCrest
              heroName={user.name}
              heroTitle={characterTitle}
              level={user.level}
              isScanning={isScanning}
              recentLevelUp={recentLevelUp}
            />
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
            <div className="flex justify-between font-black uppercase text-sm mb-2">
              <span>XP Progress</span>
              <span>{user.xp} / {user.xpRequired} XP</span>
            </div>
            <div className="w-full h-8 bg-[#F4F0EA] border-4 border-black overflow-hidden relative">
              <motion.div className="h-full bg-[#A3E635] border-r-4 border-black" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)' }} initial={{ width: '0%' }} animate={{ width: `${xpPercent}%` }} transition={{ type: 'spring', stiffness: 100 }} />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="bg-[#06B6D4] border-4 border-black p-6 shadow-[4px_4px_0_0_#000] rotate-2">
            <span className="bg-black text-[#06B6D4] font-black text-[10px] uppercase px-2 py-0.5 border border-white">OPEN LEADS</span>
            <p className="text-3xl md:text-4xl font-black mt-2 text-white" style={{ WebkitTextStroke: '1px black' }}>{leads.length.toLocaleString()}</p>
            <p className="text-[11px] font-black text-black uppercase mt-2 border-t-2 border-black/20 pt-2 tracking-tight">Stored tenant records awaiting action</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={shareStats} className="bg-black text-white hover:bg-zinc-800 font-black text-lg uppercase py-4 border-4 border-white shadow-[4px_4px_0_0_#fff] flex items-center justify-center gap-3">
            <Share2 size={20} /> Share measured counts
          </motion.button>
        </div>
      </div>
      <Crown className="absolute -bottom-10 -left-10 w-64 h-64 text-black opacity-10 group-hover:scale-110 transition-transform duration-500" />
    </motion.div>
  )
}
