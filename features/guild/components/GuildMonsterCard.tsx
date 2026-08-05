import { motion, Variants } from 'framer-motion'
import { Database, Shield } from 'lucide-react'
import { questSurface, QUEST_SUBTITLE_STROKE } from '@/components/quest'

type GuildMonsterCardProps = {
  item: Variants
  userLevel: number
  nextTarget: number
  monstersDefeated: number
  monsterProgressPct: number
}

export function GuildMonsterCard({ item, userLevel, monstersDefeated }: GuildMonsterCardProps) {
  return (
    <motion.section
      variants={item}
      aria-labelledby="guild-processed-leads-heading"
      className={questSurface({
        tone: 'ember',
        className: 'relative overflow-hidden p-6 md:col-span-8 md:p-10',
      })}
    >
      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="mb-3 inline-flex items-center gap-2 border-2 border-white bg-black px-4 py-1 text-sm font-black uppercase text-[#FFE600] shadow-[3px_3px_0_0_#fff]">
              <Shield aria-hidden="true" className="h-4 w-4" /> Stored level {userLevel}
            </span>
            <h2
              id="guild-processed-leads-heading"
              className="text-2xl font-black uppercase text-white sm:text-3xl md:text-5xl"
              style={QUEST_SUBTITLE_STROKE}
            >
              Processed leads
            </h2>
          </div>
          <Database aria-hidden="true" className="h-20 w-20 shrink-0 text-black opacity-20 md:h-28 md:w-28" />
        </div>
        <p className="text-7xl font-black leading-none text-[#FFE600] drop-shadow-[8px_8px_0_rgba(0,0,0,1)] md:text-[130px]" style={{ WebkitTextStroke: '3px black' }}>
          {monstersDefeated.toLocaleString()}
        </p>
        <p className={questSurface({ shadow: 'md', className: 'p-4 text-sm font-black uppercase' })}>
          Counted from this tenant&apos;s stored contacted and dismissed lead rows. No XP target or outcome is inferred.
        </p>
      </div>
    </motion.section>
  )
}
