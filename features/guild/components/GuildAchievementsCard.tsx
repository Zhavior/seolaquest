import { motion, Variants } from 'framer-motion'
import { Trophy, Lock } from 'lucide-react'
import { Achievement } from '@/features/guild/types'

type GuildAchievementsCardProps = {
  item: Variants
  achievementsList: Achievement[]
}

export function GuildAchievementsCard({
  item,
  achievementsList
}: GuildAchievementsCardProps) {
  return (
    <motion.div variants={item} className="mt-12">
      <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
        <div className="bg-[#FFE600] p-3 border-2 border-black shadow-[3px_3px_0_0_#000]">
          <Trophy className="w-8 h-8 text-black" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl uppercase font-black">Guild Achievements</h2>
          <p className="text-sm font-bold text-gray-600 uppercase">Unlockable Trophies & Badges</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {achievementsList.map((ach) => (
          <motion.div
            key={ach.id}
            whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
            className={`border-4 border-black p-6 relative flex flex-col justify-between shadow-[5px_5px_0_0_#000] ${
              ach.unlocked ? 'bg-white' : 'bg-[#F4F0EA] opacity-90'
            }`}
          >
            <div>
              {/* Badge Top Header */}
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{ach.badge}</span>
                {ach.unlocked ? (
                  <span className="bg-emerald-400 text-black border-2 border-black text-[10px] font-black uppercase px-2 py-0.5 shadow-[2px_2px_0_0_#000]">
                    UNLOCKED
                  </span>
                ) : (
                  <span className="bg-gray-300 text-gray-700 border-2 border-black text-[10px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> LOCKED
                  </span>
                )
              }
              </div>

              <h3 className="text-xl uppercase font-black mb-1">{ach.title}</h3>
              <p className="text-xs font-bold text-gray-600 mb-4 leading-snug">
                {ach.description}
              </p>
            </div>

            {/* Progress / Status */}
            <div className="pt-3 border-t-2 border-black">
              <div className="flex justify-between items-center text-[11px] font-black uppercase mb-1">
                <span>Progress</span>
                <span>{ach.progress} / {ach.target}</span>
              </div>
              <div className="w-full bg-gray-200 border-2 border-black h-3 overflow-hidden">
                <div 
                  className={`h-full ${ach.unlocked ? 'bg-[#A3E635]' : 'bg-[#06B6D4]'}`}
                  style={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
