'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Search, X, ShieldAlert } from 'lucide-react'
import {
  QuestBadge,
  QuestCountGrid,
  QuestPanel,
  questButton,
  questSurface,
} from '@/components/quest'
import { formatScanTime, shortScanRunId } from '../scanView'
import type { ScanRunListResult, ScanRunView } from '../types'
import { ScanStatusBadge } from './ScanStatusBadge'
import { loadMoreScanRunsAction, pollPendingScanRunsAction } from '../actions'

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 22 } },
}

export function ScanRunList({ runs: initialRuns, hasMore: initialHasMore }: ScanRunListResult) {
  const [runs, setRuns] = useState<ScanRunView[]>(initialRuns)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const shouldReduceMotion = useReducedMotion()

  // Poll for pending runs
  useEffect(() => {
    const pendingIds = runs.filter((r) => r.status === 'QUEUED' || r.status === 'RUNNING').map((r) => r.id)
    if (pendingIds.length === 0) return

    const interval = setInterval(() => {
      pollPendingScanRunsAction(pendingIds).then((updates) => {
        if (updates.length > 0) {
          setRuns((currentRuns) => {
            const updated = [...currentRuns]
            let changed = false
            updates.forEach((u) => {
              const index = updated.findIndex((r) => r.id === u.id)
              if (index !== -1 && updated[index].status !== u.status) {
                updated[index] = { ...updated[index], ...(u as unknown as Partial<ScanRunView>) } as ScanRunView
                changed = true
              }
            })
            return changed ? updated : currentRuns
          })
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [runs])

  const loadMore = () => {
    if (isPending || !hasMore || runs.length === 0) return
    const cursor = runs[runs.length - 1].id
    startTransition(async () => {
      const result = await loadMoreScanRunsAction(cursor)
      setRuns((current) => [...current, ...result.runs])
      setHasMore(result.hasMore)
    })
  }

  const filteredRuns = runs.filter((run) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      run.id.toLowerCase().includes(q) ||
      run.status.toLowerCase().includes(q) ||
      run.trigger.toLowerCase().includes(q) ||
      run.statusMessage.toLowerCase().includes(q)
    )
  })

  if (runs.length === 0) {
    return (
      <QuestPanel shadow="xl" padding="lg" className="text-center">
        <QuestBadge tone="gold" className="mx-auto mb-4" icon={<ShieldAlert aria-hidden="true" className="h-4 w-4" />}>
          No scan runs recorded
        </QuestBadge>
        <h2 className="text-2xl font-black uppercase sm:text-3xl">
          Durable scans will appear here after they are queued.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-bold text-ink-muted">
          This ledger reports saved backend state only. It does not invent provider activity or results.
        </p>
        <Link href="/app" className={questButton({ tone: 'gold', className: 'mt-6 hover:bg-yellow-300' })}>
          Return to dashboard
        </Link>
      </QuestPanel>
    )
  }

  return (
    <motion.div
      variants={container}
      initial={shouldReduceMotion ? 'show' : 'hidden'}
      animate="show"
      className="space-y-6"
    >
      {/* Search & Quick Controls */}
      <motion.div
        variants={item}
        className={questSurface({ shadow: 'md', className: 'relative flex items-center' })}
      >
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink/60" />
        <label htmlFor="scan-run-search" className="sr-only">
          Search run ID, trigger, or status
        </label>
        <input
          id="scan-run-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH RUN ID, TRIGGER, OR STATUS..."
          className="min-h-11 w-full bg-transparent py-3 pl-10 pr-12 text-xs font-black uppercase text-ink placeholder:text-ink/40 focus:outline-none sm:text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-0 flex h-11 w-11 items-center justify-center text-ink/60 hover:text-ink"
            aria-label="Clear search"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      <ul className="space-y-4">
        {filteredRuns.map((run) => (
          <motion.li key={run.id} variants={item}>
            <Link
              href={`/app/runs/${run.id}`}
              className={questSurface({ interactive: true, className: 'group block p-5' })}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <ScanStatusBadge status={run.status} />
                    <QuestBadge tone="gold" className="px-2.5 py-0.5 font-mono tracking-normal">
                      RUN {shortScanRunId(run.id)}
                    </QuestBadge>
                    <QuestBadge tone="ink" shadow="none" tilt className="px-2 py-0.5 text-[11px] tracking-normal">
                      {run.trigger}
                    </QuestBadge>
                  </div>
                  <p className="mt-3 break-word-safe text-base font-black uppercase text-ink">{run.statusMessage}</p>
                  <p className="mt-1.5 break-word-safe text-xs font-bold uppercase text-ink/70">{run.providerSummary}</p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-[10px] font-black uppercase tracking-wider text-ink/50">Last updated</p>
                  <p className="mt-0.5 text-xs font-black uppercase text-ink">{formatScanTime(run.updatedAt)}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-ink/50">
                    Completed: {formatScanTime(run.completedAt)}
                  </p>
                </div>
              </div>

              <QuestCountGrid
                className="mt-4"
                counts={[
                  { label: 'Attempts', value: run.counts.providerAttempts, accent: 'bg-card' },
                  { label: 'Returned', value: run.counts.providerResults, accent: 'bg-accent' },
                  { label: 'Source matches', value: run.counts.leadsCreated, accent: 'bg-info text-on-accent' },
                ]}
              />
            </Link>
          </motion.li>
        ))}
      </ul>

      {hasMore && (
        <motion.div variants={item} className="pt-2 text-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className={questButton({ tone: 'gold', className: 'hover:bg-yellow-300' })}
          >
            {isPending ? 'Loading...' : 'Load older runs'}
          </button>
        </motion.div>
      )}
      {!hasMore && runs.length > 0 && (
        <motion.p
          variants={item}
          className={questSurface({ border: 3, shadow: 'sm', className: 'p-3 text-center text-xs font-black uppercase' })}
        >
          End of scan runs.
        </motion.p>
      )}
    </motion.div>
  )
}
