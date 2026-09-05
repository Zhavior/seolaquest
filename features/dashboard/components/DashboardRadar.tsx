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
      className="relative min-w-0 overflow-hidden rounded-[20px] border border-outline bg-highlight p-4 shadow-sm sm:p-6 md:p-8"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className=" rounded-lg border border-outline bg-black px-3 py-1 text-xs font-semibold normal-case tracking-wide text-accent">
          Manual scan
        </span>
        <span className="rounded-lg border border-outline bg-card px-3 py-1 text-xs font-semibold normal-case tracking-wide text-ink shadow-none">
          {hasKeywords ? `${activeKeywords} active / ${keywords.length} tracked` : 'Idle — no keywords'}
        </span>
      </div>

      <div className="relative flex flex-col gap-4 items-start justify-between overflow-hidden sm:flex-row sm:items-center">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 3, x: p.x, y: p.y }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute top-1/2 left-1/2 z-30 h-8 w-8 rounded-full rounded-[20px] border border-outline bg-danger shadow-none"
            />
          ))}
        </AnimatePresence>

        <div className="max-w-full">
          <h2 id="manual-scan-heading" className="font-display sr-only">
            Manual scan control
          </h2>
          <span
            className={`inline-flex max-w-full items-center gap-2 break-words rounded-lg border border-outline px-4 py-2 text-xs font-semibold normal-case shadow-none ${
              hasKeywords ? 'bg-success text-ink' : 'bg-inset text-ink'
            }`}
          >
            <Sparkles className="h-4 w-4 text-ink" aria-hidden />
            {hasKeywords
              ? 'Keywords armed — spend 1 scan credit to run a durable scan'
              : 'Scanner idle — add a keyword on the Keyword Battlefield first'}
          </span>
        </div>

        <div className="relative flex w-full shrink-0 items-center justify-center sm:w-56">
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
            className={`relative z-10 flex w-full min-h-11 items-center justify-center gap-3 rounded-xl border border-outline px-4 py-3 text-on-forest transition-colors ${
              hasKeywords ? 'bg-forest hover:bg-forest/90' : 'bg-forest'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Radar className="h-5 w-5 text-on-forest" aria-hidden />
            <div className="flex flex-col items-center">
              <span
                className="text-center text-sm font-semibold text-on-forest"
              >
                Start scan
              </span>
              <span className=" mt-1 border border-outline bg-black px-3 py-0.5 text-xs font-semibold normal-case tracking-wide text-accent">
                {isPending ? 'Working…' : hasKeywords ? 'Uses 1 scan credit' : 'Add a keyword first'}
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.section>
  )
}
