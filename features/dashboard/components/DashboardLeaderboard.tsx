import { motion, Variants } from 'framer-motion'
import { Trophy, BarChart3 } from 'lucide-react'
import { LeaderboardUser, AnalyticsData } from '@/features/dashboard/types'

type DashboardLeaderboardProps = {
  item: Variants
  dbLeaderboard: LeaderboardUser[]
  dbAnalytics: AnalyticsData
}

export function DashboardLeaderboard({ item, dbLeaderboard, dbAnalytics }: DashboardLeaderboardProps) {
  return (
    <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
      <div className="bg-[#FFE600] border-4 border-black p-6 flex flex-col justify-between shadow-[6px_6px_0_0_#000] h-full">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 stroke-[3px]" />
            <h3 className="font-black uppercase text-xl">Top Hunters</h3>
          </div>
          <div className="space-y-3">
            {dbLeaderboard.length === 0 ? (
              <p className="border-2 border-black bg-white p-4 text-sm font-bold leading-relaxed">
                Leaderboard unavailable. Cross-account rankings stay hidden until users can explicitly opt in.
              </p>
            ) : dbLeaderboard.slice(0, 3).map((u, idx) => (
              <div key={idx} className={`p-3 border-2 border-black flex justify-between items-center ${idx === 0 ? 'bg-white shadow-[2px_2px_0_0_#000] scale-105' : 'bg-[#F4F0EA]'}`}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="shrink-0 font-black text-lg">#{idx + 1}</span>
                  <span className="min-w-0 truncate font-black uppercase text-sm">{u.name || 'Anon'}</span>
                </div>
                <span className="shrink-0 bg-black text-white px-2 py-1 text-xs font-black uppercase">Lvl {u.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#A3E635] border-4 border-black p-6 flex flex-col justify-between shadow-[6px_6px_0_0_#000] h-full">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 stroke-[3px]" />
            <h3 className="font-black uppercase text-xl">7-Day Contacted</h3>
          </div>
          <div className="grid grid-cols-7 gap-1 h-36 items-end border-b-4 border-black pb-2 sm:h-32">
            {dbAnalytics.map((item, idx) => {
              const heightPct = item.claimed > 0 ? Math.min(100, (item.claimed / 35) * 100) : 0
              return (
                <div key={item.day} className="flex flex-col items-center gap-1 h-full justify-end">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${heightPct}%` }} transition={{ duration: 0.5, delay: idx * 0.1 }} className="w-full bg-black" />
                  <span className="text-xs font-black tabular-nums">{item.claimed}</span>
                  <span className="text-xs font-black uppercase">{item.day.slice(0, 1)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
