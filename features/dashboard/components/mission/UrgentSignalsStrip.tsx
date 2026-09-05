'use client'

import { motion, type Variants } from 'framer-motion'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import type { DashboardLead } from '@/features/dashboard/types'

type UrgentSignalsStripProps = {
  item: Variants
  leads: DashboardLead[]
  onOpenQueue: () => void
  onOpenLead: (lead: DashboardLead) => void
}

function leadFact(lead: DashboardLead): string {
  const aurora = lead.aurora
  if (aurora?.evaluationStatus === 'LIVE') {
    return `LIVE score ${aurora.score}/100 · ${aurora.recommendedAction}`
  }
  if (aurora) {
    return `Scoring unavailable (${aurora.evaluationStatus})`
  }
  return 'Not scored yet'
}

/**
 * Compact above-fold risk/opportunity list for mobile-first Mission Control.
 * Shows at most three open leads with business facts only.
 */
export function UrgentSignalsStrip({
  item,
  leads,
  onOpenQueue,
  onOpenLead,
}: UrgentSignalsStripProps) {
  if (leads.length === 0) return null

  const top = leads.slice(0, 3)

  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      aria-labelledby="urgent-signals-heading"
      className="w-full min-w-0 rounded-[20px] border border-outline bg-card shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline bg-highlight px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <h2
            id="urgent-signals-heading"
            className="font-display text-sm font-semibold normal-case tracking-wide text-ink sm:text-base"
          >
            Needs attention ({leads.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenQueue}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-outline bg-card px-3 py-2 text-xs font-semibold normal-case shadow-none"
        >
          Full queue
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <ul className="divide-y divide-outline">
        {top.map((lead) => (
          <li key={lead.id}>
            <button
              type="button"
              onClick={() => onOpenLead(lead)}
              className="flex min-h-11 w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-highlight focus-visible:bg-highlight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent"
            >
              <span className="text-xs font-semibold normal-case text-ink">
                {lead.platform} · {lead.author}
              </span>
              <span className="line-clamp-2 text-sm font-medium text-ink/80">{lead.content}</span>
              <span className="text-[11px] font-medium normal-case text-ink-muted">{leadFact(lead)}</span>
            </button>
          </li>
        ))}
      </ul>
    </motion.section>
  )
}

export default UrgentSignalsStrip
