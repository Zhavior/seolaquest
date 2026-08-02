import { motion, Variants } from 'framer-motion'
import { Flame, BarChart3 } from 'lucide-react'
import { useState } from 'react'

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
    <motion.div 
      variants={item}
      className="md:col-span-6 border-4 border-black bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#000] flex flex-col justify-between"
    >
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b-4 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFE600] p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000]">
              <BarChart3 className="w-7 h-7 text-black" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl uppercase font-black leading-none">Activity Heatmap</h2>
              <p className="text-xs uppercase font-bold text-gray-500 mt-0.5">Bounty Hunter Grid</p>
            </div>
          </div>
          
          {/* Hunting Streak Badge */}
          <div className="bg-[#FF5722] text-white border-2 border-black px-3 py-1.5 shadow-[3px_3px_0_0_#000] flex items-center gap-2 self-start sm:self-auto">
            <Flame className="w-5 h-5 fill-[#FFE600] text-black animate-bounce" />
            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-[#FFE600]" style={{ WebkitTextStroke: '0.5px black' }}>
              {huntingStreak}-DAY HUNTING STREAK 🔥
            </span>
          </div>
        </div>

        <p className="text-xs font-black uppercase text-gray-500 mb-3 tracking-wider">
          Daily tenant lead activity (hover for counts)
        </p>

        {/* Activity Matrix Grid */}
        <div className="bg-black p-4 border-4 border-black shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)] relative">
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {thirtyDays.map((dateStr) => {
              const metrics = getDayMetrics(dateStr)
              const count = metrics.count

              // Color density mapping
              let bgClass = 'bg-[#1E293B] border-slate-800' // Base empty
              if (count > 7) {
                bgClass = 'bg-[#DC2626] border-black shadow-[0_0_8px_#DC2626]' // High (Deep Red)
              } else if (count > 3) {
                bgClass = 'bg-[#FF5722] border-black' // Med (Bright Orange)
              } else if (count > 0) {
                bgClass = 'bg-[#FEF08A] border-black' // Low (Light Yellow)
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
                  className={`aspect-square border-2 ${bgClass} cursor-crosshair relative transition-all duration-200 hover:scale-125 hover:z-30 hover:border-white focus-visible:scale-125 focus-visible:z-30`}
                >
                  {/* Hover Tooltip */}
                  {hoveredDate === dateStr && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white text-black border-4 border-black p-3 text-xs uppercase font-black z-50 shadow-[4px_4px_0_0_#06B6D4] whitespace-nowrap pointer-events-none">
                      <div className="text-gray-500 font-extrabold text-[10px] mb-0.5">
                        {formatDate(dateStr)}
                      </div>
                      <div className="text-black font-black text-xs">
                        🎯 {metrics.count} Stored lead events
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-gray-800 text-[11px] font-black uppercase text-gray-400">
            <span>Less Active</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#1E293B] border border-gray-600 inline-block"></span>
              <span className="w-3 h-3 bg-[#FEF08A] border border-black inline-block"></span>
              <span className="w-3 h-3 bg-[#FF5722] border border-black inline-block"></span>
              <span className="w-3 h-3 bg-[#DC2626] border border-black inline-block"></span>
            </div>
            <span>High Bounty Volume</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center text-xs uppercase font-bold text-gray-500 border-t-2 border-black/10 pt-3">
        <span>*30-day tenant activity ledger</span>
        <span className="text-black font-black">No reward value inferred</span>
      </div>
    </motion.div>
  )
}
