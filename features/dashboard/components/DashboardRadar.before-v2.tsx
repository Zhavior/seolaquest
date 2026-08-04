import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Radar } from 'lucide-react'
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
      className="xl:col-span-4 min-w-0 overflow-hidden border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000] md:p-8"
    >
      <div className="relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 3, x: p.x, y: p.y }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-6 w-6 rounded-full border-2 border-black bg-[#EF4444]"
            />
          ))}
        </AnimatePresence>

        <div
          className={`mb-6 max-w-full text-center text-xs font-black uppercase md:text-sm ${
            hasKeywords ? 'text-white' : 'text-zinc-800'
          }`}
        >
          <span
            className={`inline-flex max-w-full items-center justify-center break-words border-2 border-black px-4 py-1.5 shadow-[2px_2px_0_0_#000] ${
              hasKeywords ? 'bg-[#EF4444]' : 'bg-zinc-200'
            }`}
          >
            {hasKeywords
              ? `${keywords.length} KEYWORD${keywords.length > 1 ? 'S' : ''} CONFIGURED`
              : 'SCANNER IDLE — ADD A KEYWORD'}
          </span>
        </div>

        <div className="relative flex w-full max-w-[240px] items-center justify-center">
          {hasKeywords && (
            <>
              <div className="pointer-events-none absolute inset-0 z-0 rounded-full bg-[#EF4444]/30 animate-ping" />
              <div className="pointer-events-none absolute -inset-4 z-0 rounded-full border-4 border-dashed border-[#EF4444] opacity-60 animate-[spin_10s_linear_infinite]" />
            </>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)' }}
            animate={isPending ? { x: [-4, 4, -4, 4, 0], rotate: [-2, 2, -2, 2, 0] } : {}}
            transition={{ repeat: isPending ? Infinity : 0, duration: 0.2 }}
            onClick={runMockScanner}
            disabled={isPending}
            className="relative z-10 flex aspect-square w-full max-w-[240px] cursor-crosshair flex-col items-center justify-center gap-4 rounded-full border-8 border-black bg-[#EF4444] shadow-[8px_16px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            style={{ background: 'radial-gradient(circle at 30% 30%, #ff7373, #EF4444)' }}
          >
            <Radar className="h-20 w-20 text-white" />
            <span
              className="px-4 text-center text-xl font-black uppercase tracking-wider text-white md:text-2xl"
              style={{ WebkitTextStroke: '1px black' }}
            >
              Manual Scan
            </span>
          </motion.button>
        </div>

        <p className="mt-6 max-w-[26ch] text-center text-[11px] font-black uppercase tracking-[0.14em] text-black/60">
          {hasKeywords
            ? 'Pulse the radar for a fresh sweep across active routes.'
            : 'Configure tracked keywords first, then trigger a full scan pulse.'}
        </p>

        <Radar className="pointer-events-none absolute right-0 top-0 h-64 w-64 text-black opacity-5 transition-transform duration-1000" />
      </div>
    </motion.div>
  )
}
