import { motion, Variants } from 'framer-motion'
import { Database, Shield } from 'lucide-react'
import { questSurface } from '@/components/quest'

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
        tone: 'ink',
        className: 'relative overflow-hidden p-6 md:col-span-8 md:p-10',
      })}
    >
      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="mb-3 inline-flex items-center gap-2 rounded-lg border border-white bg-black px-4 py-1 text-sm font-semibold normal-case text-accent shadow-none">
              <Shield aria-hidden="true" className="h-4 w-4" /> Stored level {userLevel}
            </span>
            <h2
              id="guild-processed-leads-heading"
              className="font-display text-2xl font-normal text-on-forest sm:text-3xl md:text-4xl"
            >
              Processed leads
            </h2>
          </div>
          <Database aria-hidden="true" className="h-12 w-12 shrink-0 text-on-forest opacity-30" />
        </div>
        <p className="font-display text-6xl leading-none text-on-forest md:text-8xl">
          {monstersDefeated.toLocaleString()}
        </p>
        <p className={questSurface({ shadow: 'md', className: 'p-4 text-sm font-semibold normal-case' })}>
          Counted from this tenant&apos;s stored contacted and dismissed lead rows. No XP target or outcome is inferred.
        </p>
      </div>
    </motion.section>
  )
}
