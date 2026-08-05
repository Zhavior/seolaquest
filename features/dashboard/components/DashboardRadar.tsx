'use client'

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Radar, Sparkles } from 'lucide-react'
import { DashboardKeyword } from '@/features/dashboard/types'

type DashboardRadarProps = {
  item: Variants
  particles: { id: number; x: number; y: number }[]
  keywords: DashboardKeyword[]
  isPending: boolean
  runMockScanner: () => void
}

export function DashboardRadar({
  item,
  particles,
  keywords,
  isPending,
  runMockScanner,
}: DashboardRadarProps) {
  const hasKeywords = keywords.length > 0

  return (
    <motion.div
      variants={item}
      className="xl:col-span-4 min-w-0 overflow-hidden border-4 border-outline bg-highlight p-4 shadow-brutal-lg sm:p-6 md:p-8 relative"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="bg-black text-[#FFE600] uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-outline -rotate-1">
          RADAR CONTROL CENTRE & SIGNAL PULSE
        </span>
        <span className="bg-card text-ink uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-outline shadow-brutal-sm">
          {hasKeywords ? `${keywords.length} TRACKED KEYWORDS` : 'IDLE'}
        </span>
      </div>

      <div className="relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden border-4 border-outline bg-card p-4 shadow-brutal-lg sm:min-h-[420px] sm:p-6">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 3, x: p.x, y: p.y }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-8 w-8 rounded-full border-3 border-outline bg-danger shadow-brutal-sm"
            />
          ))}
        </AnimatePresence>

        <div className="mb-6 max-w-full text-center text-xs font-black uppercase md:text-sm">
          <span
            className={`inline-flex max-w-full items-center gap-2 break-words border-2 border-outline px-4 py-2 text-xs font-black uppercase shadow-brutal-sm ${
              hasKeywords ? 'bg-success text-ink' : 'bg-inset text-ink'
            }`}
          >
            <Sparkles className="h-4 w-4 text-ink" />
            {hasKeywords
              ? `${keywords.length} KEYWORD${keywords.length > 1 ? 'S' : ''} CONFIGURED & READY FOR PULSE`
              : 'SCANNER IDLE — ADD A KEYWORD BELOW'}
          </span>
        </div>

        {/* Arcade Radar Button Container */}
        <div className="relative flex w-full max-w-[220px] items-center justify-center py-4 sm:max-w-[320px]">
          {hasKeywords && (
            <>
              <div className="pointer-events-none absolute inset-0 z-0 rounded-full bg-accent-2/25 animate-ping" />
              <div className="pointer-events-none absolute -inset-6 z-0 rounded-full border-4 border-dashed border-[#FF5722] opacity-60 animate-[spin_12s_linear_infinite]" />
            </>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            animate={isPending ? { x: [-4, 4, -4, 4, 0], rotate: [-2, 2, -2, 2, 0] } : {}}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            onClick={runMockScanner}
            disabled={isPending}
            className={`relative z-10 flex aspect-square w-full max-w-[200px] min-h-[44px] cursor-crosshair flex-col items-center justify-center gap-2 rounded-full border-4 border-outline text-white shadow-brutal-lg transition-all sm:max-w-[280px] sm:gap-3 ${
              hasKeywords ? 'bg-accent-2 hover:bg-[#FF7043]' : 'bg-zinc-400'
            } disabled:opacity-50`}
          >
            <Radar className="h-12 w-12 text-white drop-shadow-brutal-sm sm:h-20 sm:w-20" />
            <div className="flex flex-col items-center">
              <span
                className="px-2 text-center text-xl font-black uppercase tracking-tight text-white drop-shadow-brutal sm:px-4 sm:text-3xl"
                style={{ WebkitTextStroke: '2px black' }}
              >
                Manual Scan
              </span>
              <span className="mt-1 bg-black text-[#FFE600] px-3 py-0.5 text-xs font-black uppercase tracking-wide border border-outline -rotate-1">
                {isPending ? 'PULSING GRID...' : 'TRIGGER PULSE (-1 MP)'}
              </span>
            </div>
          </motion.button>
        </div>

        <p className="mt-6 max-w-[32ch] text-center text-xs font-black uppercase tracking-wider text-ink/70">
          {hasKeywords
            ? 'Pulse the radar for a fresh sweep across active routes.'
            : 'Configure tracked keywords first, then trigger a full scan pulse.'}
        </p>

        <Radar className="pointer-events-none absolute right-0 top-0 h-64 w-64 text-ink opacity-5 transition-transform duration-1000" />
      </div>
    </motion.div>
  )
}

export default DashboardRadar
