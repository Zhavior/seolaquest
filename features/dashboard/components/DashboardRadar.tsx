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
      className="xl:col-span-4 min-w-0 overflow-hidden border-4 border-black bg-[#FFF8D9] p-6 shadow-[6px_6px_0_0_#000] md:p-8 relative"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="bg-black text-[#FFE600] uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-black -rotate-1">
          RADAR CONTROL CENTRE & SIGNAL PULSE
        </span>
        <span className="bg-white text-black uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
          {hasKeywords ? `${keywords.length} TRACKED KEYWORDS` : 'IDLE'}
        </span>
      </div>

      <div className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 3, x: p.x, y: p.y }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-8 w-8 rounded-full border-3 border-black bg-[#EF4444] shadow-[2px_2px_0_0_#000]"
            />
          ))}
        </AnimatePresence>

        <div className="mb-6 max-w-full text-center text-xs font-black uppercase md:text-sm">
          <span
            className={`inline-flex max-w-full items-center gap-2 break-words border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#000] ${
              hasKeywords ? 'bg-[#A3E635] text-black' : 'bg-zinc-200 text-black'
            }`}
          >
            <Sparkles className="h-4 w-4 text-black" />
            {hasKeywords
              ? `${keywords.length} KEYWORD${keywords.length > 1 ? 'S' : ''} CONFIGURED & READY FOR PULSE`
              : 'SCANNER IDLE — ADD A KEYWORD BELOW'}
          </span>
        </div>

        {/* Arcade Radar Button Container */}
        <div className="relative flex w-full max-w-[320px] items-center justify-center py-4">
          {hasKeywords && (
            <>
              <div className="pointer-events-none absolute inset-0 z-0 rounded-full bg-[#FF5722]/25 animate-ping" />
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
            className={`relative z-10 flex aspect-square w-full max-w-[280px] min-h-[44px] cursor-crosshair flex-col items-center justify-center gap-3 rounded-full border-4 border-black text-white shadow-[8px_8px_0_0_#000] transition-all ${
              hasKeywords ? 'bg-[#FF5722] hover:bg-[#FF7043]' : 'bg-zinc-400'
            } disabled:opacity-50`}
          >
            <Radar className="h-20 w-20 text-white drop-shadow-[3px_3px_0_rgba(0,0,0,1)]" />
            <div className="flex flex-col items-center">
              <span
                className="px-4 text-center text-3xl font-black uppercase tracking-tight text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
                style={{ WebkitTextStroke: '2px black' }}
              >
                Manual Scan
              </span>
              <span className="mt-1 bg-black text-[#FFE600] px-3 py-0.5 text-[10px] font-black uppercase tracking-widest border border-black -rotate-1">
                {isPending ? 'PULSING GRID...' : 'TRIGGER PULSE (-5 MP)'}
              </span>
            </div>
          </motion.button>
        </div>

        <p className="mt-6 max-w-[32ch] text-center text-xs font-black uppercase tracking-wider text-black/70">
          {hasKeywords
            ? 'Pulse the radar for a fresh sweep across active routes.'
            : 'Configure tracked keywords first, then trigger a full scan pulse.'}
        </p>

        <Radar className="pointer-events-none absolute right-0 top-0 h-64 w-64 text-black opacity-5 transition-transform duration-1000" />
      </div>
    </motion.div>
  )
}

export default DashboardRadar
