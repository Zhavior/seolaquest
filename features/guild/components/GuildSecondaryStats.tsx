import { motion, Variants } from 'framer-motion'
import { FileText, Share2 } from 'lucide-react'

type GuildSecondaryStatsProps = {
  item: Variants
  spellsCast: number
  manaEfficiency: number
  manaPerReply: number
  questsExported: number
}

export function GuildSecondaryStats({ item, spellsCast, questsExported }: GuildSecondaryStatsProps) {
  return (
    <div className="flex flex-col gap-6 md:col-span-4 md:gap-8">
      <motion.div variants={item} className="flex-1 border-4 border-black bg-[#06B6D4] p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black uppercase text-white" style={{ WebkitTextStroke: '1px black' }}>AI drafts</h2>
            <span className="mt-1 inline-block border border-black bg-white/90 px-2 py-0.5 text-xs font-bold uppercase">Successful generations recorded</span>
          </div>
          <FileText className="h-8 w-8" />
        </div>
        <p className="my-5 text-6xl font-black leading-none text-black md:text-7xl">{spellsCast.toLocaleString()}</p>
        <p className="border-2 border-black bg-white p-3 text-xs font-black uppercase shadow-[3px_3px_0_0_#000]">
          Reply sends, mana efficiency, and outcomes are not measured.
        </p>
      </motion.div>

      <motion.div variants={item} className="flex-1 border-4 border-black bg-[#A3E635] p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black uppercase text-white" style={{ WebkitTextStroke: '1px black' }}>CRM deliveries</h2>
            <span className="mt-1 inline-block border border-black bg-white/90 px-2 py-0.5 text-xs font-bold uppercase">Server-recorded completed exports</span>
          </div>
          <Share2 className="h-8 w-8" />
        </div>
        <p className="my-5 text-6xl font-black leading-none text-black md:text-7xl">{questsExported.toLocaleString()}</p>
        <p className="border-2 border-black bg-white p-3 text-xs font-black uppercase shadow-[3px_3px_0_0_#000]">
          Provider readiness is not inferred from this historical count.
        </p>
      </motion.div>
    </div>
  )
}
