import { motion, Variants } from 'framer-motion'
import { Flame, Sparkles, Crosshair, Target, Clock } from 'lucide-react'
import { QuestBadge, QuestSectionHeading, QUEST_EYEBROW, questSurface } from '@/components/quest'
import { ChannelBreakdown } from '@/features/guild/types'

type GuildArmoryCardProps = {
  item: Variants
  deadliestArtifact: string
  deadliestWeaponCount: number
  channels: ChannelBreakdown[]
  criticalHitRate: number
  scoutSpeed: string
}

export function GuildArmoryCard({
  item,
  deadliestArtifact,
  deadliestWeaponCount,
  channels,
  scoutSpeed
}: GuildArmoryCardProps) {
  return (
    <motion.section
      variants={item}
      aria-labelledby="guild-armory-heading"
      className={questSurface({
        className: 'md:col-span-6 flex flex-col justify-between p-6 md:p-8',
      })}
    >
      <div>
        <QuestSectionHeading
          titleId="guild-armory-heading"
          icon={<Flame className="h-7 w-7 text-white" />}
          iconTone="ember"
          title="The Armory"
          subtitle="Weapon Proficiency Matrix"
          action={<QuestBadge tone="gold">Top artifacts</QuestBadge>}
        />

        {/* Top Keyword = "Legendary Weapon" */}
        <p className={`${QUEST_EYEBROW} mb-2`}>
          Top Keyword • Legendary Weapon Artifact
        </p>

        <div className={questSurface({ tone: 'parchment', shadow: 'md', className: 'relative mb-6 overflow-hidden p-5' })}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles aria-hidden="true" className="w-4 h-4 text-[#FF5722]" />
            <QuestBadge tone="ember" border={2} shadow="none" className="px-2 py-0.5 tracking-normal">
              Measured keyword
            </QuestBadge>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-black uppercase break-word-safe relative z-10 leading-snug">
            &quot;{deadliestArtifact}&quot;
          </h3>

          <div className="mt-4 flex justify-between items-end relative z-10 pt-4 border-t-2 border-black/20">
            <div className="flex min-w-0 flex-col">
              <span className="text-xs uppercase font-extrabold text-gray-600">Contacted lead records</span>
              <span className="text-3xl md:text-4xl font-black text-[#FF5722] drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                {deadliestWeaponCount} records
              </span>
            </div>
            <Crosshair aria-hidden="true" className="w-12 h-12 shrink-0 text-black opacity-80" />
          </div>

          <div aria-hidden="true" className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ background: 'repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)' }}></div>
        </div>

        {/* Channel Distribution Pie/Bar */}
        <div className="space-y-3 mb-6">
          <p className={QUEST_EYEBROW}>
            Channel Origin Distribution
          </p>

          <div className={questSurface({ tone: 'parchment', border: 2, shadow: 'sm', className: 'space-y-2 p-4' })}>
            {channels.length === 0 && <p className="text-sm font-bold text-gray-600">No stored channel distribution yet.</p>}
            {channels.map((chan, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-black uppercase">
                  <span>{chan.name}</span>
                  <span>{chan.percent}%</span>
                </div>
                <div className="w-full bg-white border-2 border-black h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${chan.percent}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className="h-full border-r-2 border-black"
                    style={{ backgroundColor: chan.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scout Speed & Critical Hits Matrix */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={questSurface({ tone: 'parchment', shadow: 'sm', className: 'p-4' })}>
          <div className="flex items-center gap-2 mb-1">
            <Target aria-hidden="true" className="w-4 h-4 text-red-600" />
            <p className="text-xs font-black text-gray-600 uppercase">Critical Hit Rate</p>
          </div>
          <p className="text-xl font-black text-black">Not measured</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">No conversion event model</p>
        </div>

        <div className={questSurface({ tone: 'parchment', shadow: 'sm', className: 'p-4' })}>
          <div className="flex items-center gap-2 mb-1">
            <Clock aria-hidden="true" className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-black text-gray-600 uppercase">Scout Speed</p>
          </div>
          <p className="text-2xl font-black text-black truncate">{scoutSpeed}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Only shown when measured</p>
        </div>
      </div>
    </motion.section>
  )
}
