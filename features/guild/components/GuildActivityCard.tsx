import { motion, Variants } from 'framer-motion'
import { Flame, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { QuestBadge, QUEST_EYEBROW, questSurface } from '@/components/quest'

type GuildActivityCardProps = {
  item: Variants
  huntingStreak: number
  thirtyDays: string[]
  getDayMetrics: (dateStr: string) => { count: number; autoReplies: number }
  formatDate: (dateStr: string) => string
}

export function GuildActivityCard({
  item,
  huntingStreak,
  thirtyDays,
  getDayMetrics,
  formatDate
}: GuildActivityCardProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  return (
    <motion.section
      variants={item}
      aria-labelledby="guild-activity-heading"
      className={questSurface({
        className: 'md:col-span-6 flex flex-col justify-between p-6 md:p-8',
      })}
    >
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b-4 border-outline pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className={questSurface({ tone: 'gold', border: 2, shadow: 'xs', className: 'shrink-0 p-2.5' })}
            >
              <BarChart3 className="w-7 h-7 text-ink" />
            </span>
            <div className="min-w-0">
              <h2 id="guild-activity-heading" className="text-2xl md:text-3xl uppercase font-black leading-none">
                Activity Heatmap
              </h2>
              <p className="text-xs uppercase font-bold text-ink-muted mt-0.5">Bounty Hunter Grid</p>
            </div>
          </div>

          {/* Hunting Streak Badge */}
          <QuestBadge
            tone="ember"
            shadow="sm"
            className="self-start px-3 py-1.5 text-xs text-[#FFE600] sm:self-auto md:text-sm"
            icon={<Flame aria-hidden="true" className="w-5 h-5 fill-[#FFE600] text-ink animate-bounce motion-reduce:animate-none" />}
          >
            <span style={{ WebkitTextStroke: '0.5px black' }}>{huntingStreak}-DAY HUNTING STREAK 🔥</span>
          </QuestBadge>
        </div>

        <p className={`${QUEST_EYEBROW} mb-3`}>
          Daily tenant lead activity (hover for counts)
        </p>

        {/* Activity Matrix Grid */}
        <div className="bg-black p-4 border-4 border-outline shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)] relative">
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {thirtyDays.map((dateStr) => {
              const metrics = getDayMetrics(dateStr)
              const count = metrics.count

              // Color density mapping
              let bgClass = 'bg-[#1E293B] border-hairline' // Base empty
              if (count > 7) {
                bgClass = 'bg-[#DC2626] border-outline shadow-[0_0_8px_#DC2626]' // High (Deep Red)
              } else if (count > 3) {
                bgClass = 'bg-accent-2 border-outline' // Med (Bright Orange)
              } else if (count > 0) {
                bgClass = 'bg-highlight border-outline' // Low (Light Yellow)
              }

              return (
                <button
                  type="button"
                  key={dateStr}
                  aria-label={`${formatDate(dateStr)}: ${metrics.count} stored lead events`}
                  onMouseEnter={() => setHoveredDate(dateStr)}
                  onMouseLeave={() => setHoveredDate(null)}
                  onFocus={() => setHoveredDate(dateStr)}
                  onBlur={() => setHoveredDate(null)}
                  className={`aspect-square border-2 ${bgClass} cursor-crosshair relative transition-all duration-200 hover:scale-125 hover:z-30 hover:border-white focus-visible:scale-125 focus-visible:z-30 motion-reduce:transition-none`}
                >
                  {/* Hover Tooltip */}
                  {hoveredDate === dateStr && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-card text-ink border-4 border-outline p-3 text-xs uppercase font-black z-50 shadow-[4px_4px_0_0_#06B6D4] whitespace-nowrap pointer-events-none">
                      <div className="text-ink-muted font-extrabold text-[10px] mb-0.5">
                        {formatDate(dateStr)}
                      </div>
                      <div className="text-ink font-black text-xs">
                        🎯 {metrics.count} Stored lead events
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-hairline text-[11px] font-black uppercase text-ink-muted">
            <span>Less Active</span>
            <div aria-hidden="true" className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#1E293B] border border-hairline inline-block"></span>
              <span className="w-3 h-3 bg-highlight border border-outline inline-block"></span>
              <span className="w-3 h-3 bg-accent-2 border border-outline inline-block"></span>
              <span className="w-3 h-3 bg-[#DC2626] border border-outline inline-block"></span>
            </div>
            <span>High Bounty Volume</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center text-xs uppercase font-bold text-ink-muted border-t-2 border-outline/10 pt-3">
        <span>*30-day tenant activity ledger</span>
        <span className="text-ink font-black">No reward value inferred</span>
      </div>
    </motion.section>
  )
}
