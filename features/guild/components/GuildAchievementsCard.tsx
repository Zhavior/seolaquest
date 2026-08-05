import { motion, Variants } from 'framer-motion'
import { Trophy, Lock } from 'lucide-react'
import { QuestBadge, QuestSectionHeading, questSurface } from '@/components/quest'
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
    <motion.section variants={item} aria-labelledby="guild-achievements-heading" className="mt-12">
      <QuestSectionHeading
        titleId="guild-achievements-heading"
        icon={<Trophy className="w-8 h-8 text-ink" />}
        iconTone="gold"
        title="Guild Achievements"
        subtitle="Unlockable Trophies & Badges"
        className="gap-4"
      />

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {achievementsList.map((ach) => (
          <motion.li
            key={ach.id}
            whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
            className={questSurface({
              tone: ach.unlocked ? 'white' : 'parchment',
              shadow: 'none',
              className: `relative flex flex-col justify-between p-6 shadow-brutal ${
                ach.unlocked ? '' : 'opacity-90'
              }`,
            })}
          >
            <div>
              {/* Badge Top Header */}
              <div className="flex justify-between items-start mb-4">
                <span aria-hidden="true" className="text-4xl">{ach.badge}</span>
                {ach.unlocked ? (
                  <QuestBadge
                    tone="none"
                    className="bg-emerald-400 px-2 py-0.5 text-[10px] tracking-normal text-ink"
                  >
                    Unlocked
                  </QuestBadge>
                ) : (
                  <QuestBadge
                    tone="none"
                    shadow="none"
                    className="gap-1 bg-gray-300 px-2 py-0.5 text-[10px] tracking-normal text-ink-muted"
                    icon={<Lock aria-hidden="true" className="w-3 h-3" />}
                  >
                    Locked
                  </QuestBadge>
                )}
              </div>

              <h3 className="text-xl uppercase font-black mb-1">{ach.title}</h3>
              <p className="text-xs font-bold text-ink-muted mb-4 leading-snug">
                {ach.description}
              </p>
            </div>

            {/* Progress / Status */}
            <div className="pt-3 border-t-2 border-outline">
              <div className="flex justify-between items-center text-[11px] font-black uppercase mb-1">
                <span>Progress</span>
                <span>{ach.progress} / {ach.target}</span>
              </div>
              <div
                role="progressbar"
                aria-label={`${ach.title} progress`}
                aria-valuemin={0}
                aria-valuemax={ach.target}
                aria-valuenow={ach.progress}
                className="w-full bg-inset border-2 border-outline h-3 overflow-hidden"
              >
                <div
                  className={`h-full ${ach.unlocked ? 'bg-success' : 'bg-info'}`}
                  style={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}
                ></div>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  )
}
