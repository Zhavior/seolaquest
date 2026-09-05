'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ScrollText } from 'lucide-react'

type IntelLogPanelProps = {
  item: Variants
  notice: string
  scanOutcome: string | null | undefined
  isScannerOpen: boolean
  onOpenScanner: () => void
}

/**
 * Thin intel strip from measured notices / scan outcome only — not a fabricated activity feed.
 */
export function IntelLogPanel({
  item,
  notice,
  scanOutcome,
  isScannerOpen,
  onOpenScanner,
}: IntelLogPanelProps) {
  const hasNotice = Boolean(notice?.trim())
  const outcomeLabel =
    scanOutcome === 'succeeded'
      ? 'Last scan outcome: succeeded'
      : scanOutcome === 'failed'
        ? 'Last scan outcome: failed'
        : scanOutcome === 'pending'
          ? 'Last scan outcome: still pending'
          : null

  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      aria-labelledby="intel-log-heading"
      className="w-full min-w-0 rounded-[20px] border border-outline bg-card shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline bg-highlight px-4 py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 shrink-0" aria-hidden />
          <h2 id="intel-log-heading" className="font-display text-sm font-semibold normal-case tracking-wide sm:text-base">
            Intel log
          </h2>
        </div>
        <Link
          href="/app/runs"
          className="inline-flex min-h-11 items-center rounded-lg border border-outline bg-card px-3 py-2 text-xs font-semibold normal-case shadow-none hover:bg-highlight"
        >
          Run history
        </Link>
      </div>

      <div className="space-y-3 p-4">
        {outcomeLabel ? (
          <p className="text-sm font-medium text-ink">
            {outcomeLabel}
            {isScannerOpen || scanOutcome === 'pending' || scanOutcome === 'succeeded' || scanOutcome === 'failed' ? (
              <>
                {' '}
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="underline underline-offset-2"
                >
                  Open scanner log
                </button>
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-sm font-medium text-ink/65">No scan outcome recorded in this session yet.</p>
        )}

        {hasNotice ? (
          <p className="rounded-lg border border-outline bg-inset px-3 py-2 text-sm font-medium text-ink">{notice}</p>
        ) : (
          <p className="text-sm font-medium text-ink/65">No dashboard notice right now.</p>
        )}
      </div>
    </motion.section>
  )
}

export default IntelLogPanel
