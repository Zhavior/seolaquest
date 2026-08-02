import { motion, Variants } from 'framer-motion'
import { Zap, Share2, CheckCircle2, Activity } from 'lucide-react'

type GuildSecondaryStatsProps = {
  item: Variants
  spellsCast: number
  manaEfficiency: number
  manaPerReply: number
  questsExported: number
}

export function GuildSecondaryStats({
  item,
  spellsCast,
  manaEfficiency,
  manaPerReply,
  questsExported
}: GuildSecondaryStatsProps) {
  return (
    <div className="md:col-span-4 flex flex-col gap-6 md:gap-8">
      {/* Spells Cast (Auto-Replies) Card */}
      <motion.div 
        variants={item}
        whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
        className="flex-1 border-4 border-black bg-[#06B6D4] p-6 flex flex-col justify-between relative overflow-hidden shadow-[6px_6px_0_0_#000]"
      >
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h2 className="text-3xl uppercase text-white" style={{ WebkitTextStroke: '1px black' }}>Spells Cast</h2>
            <span className="text-xs font-bold text-black uppercase bg-white/90 border border-black px-2 py-0.5 mt-1 inline-block">
              (Auto-Replies)
            </span>
          </div>
          <div className="bg-black p-2 border-2 border-white shadow-[2px_2px_0_0_#fff]">
            <Zap className="w-7 h-7 text-[#FFE600] fill-[#FFE600]" />
          </div>
        </div>

        <div className="relative z-10 my-4">
          <p className="text-6xl md:text-7xl text-black font-black leading-none">{spellsCast}</p>
          <p className="text-xs font-bold text-black uppercase mt-1">
            (Auto-Replies Triggered: {spellsCast})
          </p>
        </div>

        <div className="relative z-10 border-2 border-black bg-white p-3 shadow-[3px_3px_0_0_#000]">
          <div className="flex justify-between text-xs uppercase font-black text-black mb-1">
            <span>Mana Efficiency</span>
            <span>{manaEfficiency}%</span>
          </div>
          <div className="w-full bg-[#E2E8F0] border-2 border-black h-3 mb-1">
            <div className="bg-[#06B6D4] h-full" style={{ width: `${manaEfficiency}%` }}></div>
          </div>
          <p className="text-[11px] font-extrabold text-gray-700 uppercase">
            ⚡ {manaEfficiency}% Efficiency • {manaPerReply} Mana / Reply
          </p>
        </div>

        <Zap className="absolute -bottom-10 -right-10 w-44 h-44 text-black opacity-10 pointer-events-none" />
      </motion.div>

      {/* Quests Exported / Loot Collected Card */}
      <motion.div 
        variants={item}
        whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
        className="flex-1 border-4 border-black bg-[#A3E635] p-6 flex flex-col justify-between relative overflow-hidden shadow-[6px_6px_0_0_#000]"
      >
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h2 className="text-3xl uppercase text-white leading-tight" style={{ WebkitTextStroke: '1px black' }}>
              Loot Collected
            </h2>
            <span className="text-xs font-bold text-black uppercase bg-white/90 border border-black px-2 py-0.5 mt-1 inline-block">
              Quests Exported
            </span>
          </div>
          <div className="bg-black p-2 border-2 border-white shadow-[2px_2px_0_0_#fff]">
            <Share2 className="w-7 h-7 text-[#A3E635]" />
          </div>
        </div>

        <div className="relative z-10 my-4">
          <p className="text-6xl md:text-7xl text-black font-black leading-none">{questsExported}</p>
          <p className="text-xs font-bold text-black uppercase mt-1">
            CSV / Webhook / CRM Exports: {questsExported}
          </p>
        </div>

        <div className="relative z-10 border-2 border-black bg-white p-3 shadow-[3px_3px_0_0_#000] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase text-black">Webhook Vault</span>
          </div>
          <span className="text-[10px] font-black uppercase bg-black text-[#A3E635] px-2 py-0.5 border border-black">
            SYNC READY
          </span>
        </div>

        <Activity className="absolute -bottom-10 -right-10 w-44 h-44 text-black opacity-10 pointer-events-none" />
      </motion.div>
    </div>
  )
}
