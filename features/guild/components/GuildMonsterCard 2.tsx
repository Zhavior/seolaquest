import { motion, Variants } from 'framer-motion'
import { Crown, Skull, TrendingUp } from 'lucide-react'

type GuildMonsterCardProps = {
  item: Variants
  userLevel: number
  nextTarget: number
  monstersDefeated: number
  monsterProgressPct: number
}

export function GuildMonsterCard({
  item,
  userLevel,
  nextTarget,
  monstersDefeated,
  monsterProgressPct
}: GuildMonsterCardProps) {
  return (
    <motion.div 
      variants={item}
      whileHover={{ y: -4, x: -4, boxShadow: "10px 10px 0px 0px rgba(0,0,0,1)" }}
      className="md:col-span-8 border-4 border-black bg-[#FF5722] p-6 md:p-10 relative group shadow-[6px_6px_0_0_#000] overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px', backgroundPosition: '-2px -2px' }}
    >
      <div className="absolute inset-0 bg-[#FF5722] opacity-95 z-0 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="bg-black text-[#FFE600] uppercase px-4 py-1 inline-flex items-center gap-2 font-black text-sm md:text-base mb-3 shadow-[3px_3px_0_0_#fff] border-2 border-white -rotate-2">
              <Crown className="w-4 h-4" /> LVL {userLevel} HUNTER STATUS
            </div>
            <h2 className="text-3xl md:text-5xl uppercase text-white" style={{ WebkitTextStroke: '1.5px black' }}>
              Monsters Defeated
            </h2>
          </div>
          
          <Skull className="w-20 h-20 md:w-32 md:h-32 text-black opacity-20 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-12" />
        </div>

        <div className="flex items-baseline gap-4">
          <p className="text-7xl md:text-[130px] leading-none text-[#FFE600] drop-shadow-[8px_8px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '3px black' }}>
            {monstersDefeated}
          </p>
          <div className="bg-black text-white px-4 py-2 text-xs md:text-sm font-bold border-2 border-white uppercase shadow-[3px_3px_0_0_#FFE600]">
            (Total Leads Processed: {monstersDefeated})
          </div>
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs md:text-sm uppercase font-black tracking-wider text-black flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF5722]" />
              LVL {userLevel} HUNTER • Next level at {nextTarget} Monsters
            </span>
            <span className="text-xs font-black bg-[#FFE600] text-black px-2 py-0.5 border-2 border-black">
              {monsterProgressPct}% XP
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] border-2 border-black h-5 relative overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${monsterProgressPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="bg-[#FFE600] h-full border-r-2 border-black relative"
            >
              <div className="absolute inset-0 bg-white/20" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.1) 6px, rgba(0,0,0,0.1) 12px)' }}></div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
