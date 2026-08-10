'use client'

import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion'
import { Radar, Sparkles } from 'lucide-react'
import type { DashboardKeyword } from '@/features/dashboard/types'

type DashboardRadarProps = {
  item: Variants
  particles: { id: number; x: number; y: number }[]
  keywords: DashboardKeyword[]
  isPending: boolean
  runMockScanner: () => void
}

/**
 * Manual scan control. Secondary to Today's Mission CTA — no perpetual
 * motion that implies a live patrol when none is measured.
 */
export function DashboardRadar({
  item,
  particles,
  keywords,
  isPending,
  runMockScanner,
}: DashboardRadarProps) {
  const hasKeywords = keywords.length > 0
  const activeKeywords = keywords.filter((keyword) => keyword.active).length
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.section
      variants={item}
      aria-labelledby="manual-scan-heading"
      className="relative min-w-0 overflow-hidden border-4 border-outline bg-highlight p-4 shadow-brutal-lg sm:p-6 md:p-8"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="-rotate-1 border-2 border-outline bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-[#FFE600]">
          Manual scan
        </span>
        <span className="border-2 border-outline bg-card px-3 py-1 text-xs font-black uppercase tracking-widest text-ink shadow-brutal-sm">
          {hasKeywords ? `${activeKeywords} active / ${keywords.length} tracked` : 'Idle — no keywords'}
        </span>
      </div>

      <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden border-4 border-outline bg-card p-4 shadow-brutal-lg sm:min-h-[320px] sm:p-6">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 3, x: p.x, y: p.y }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute top-1/2 left-1/2 z-30 h-8 w-8 rounded-full border-3 border-outline bg-danger shadow-brutal-sm"
            />
          ))}
        </AnimatePresence>

        <div className="mb-6 max-w-full text-center">
          <h2 id="manual-scan-heading" className="sr-only">
            Manual scan control
          </h2>
          <span
            className={`inline-flex max-w-full items-center gap-2 break-words border-2 border-outline px-4 py-2 text-xs font-black uppercase shadow-brutal-sm ${
              hasKeywords ? 'bg-success text-ink' : 'bg-inset text-ink'
            }`}
          >
            <Sparkles className="h-4 w-4 text-ink" aria-hidden />
            {hasKeywords
              ? 'Keywords armed — spend 1 scan credit to run a durable scan'
              : 'Scanner idle — add a keyword on the Keyword Battlefield first'}
          </span>
        </div>

        <div className="relative flex w-full max-w-[220px] items-center justify-center py-4 sm:max-w-[280px]">
          <motion.button
            type="button"
            whileHover={
              shouldReduceMotion || isPending || !hasKeywords ? undefined : { scale: 1.04 }
            }
            whileTap={
              shouldReduceMotion || isPending || !hasKeywords ? undefined : { scale: 0.96 }
            }
            onClick={runMockScanner}
            disabled={isPending || !hasKeywords}
            className={`relative z-10 flex aspect-square w-full max-w-[200px] min-h-11 cursor-crosshair flex-col items-center justify-center gap-2 rounded-full border-4 border-outline text-white shadow-brutal-lg transition-all sm:max-w-[260px] sm:gap-3 ${
              hasKeywords ? 'bg-accent-2 hover:bg-[#FF7043]' : 'bg-zinc-400'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Radar className="h-12 w-12 text-white drop-shadow-brutal-sm sm:h-16 sm:w-16" aria-hidden />
            <div className="flex flex-col items-center">
              <span
                className="px-2 text-center text-xl font-black uppercase tracking-tight text-white drop-shadow-brutal sm:px-4 sm:text-2xl"
                style={{ WebkitTextStroke: '2px black' }}
              >
                Start scan
              </span>
              <span className="-rotate-1 mt-1 border border-outline bg-black px-3 py-0.5 text-xs font-black uppercase tracking-wide text-[#FFE600]">
                {isPending ? 'Working…' : hasKeywords ? 'Uses 1 scan credit' : 'Add a keyword first'}
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.section>
  )
}
