'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Search, X, ShieldAlert } from 'lucide-react'
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
      <div className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0_0_#000]">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 border-2 border-black bg-[#FFE600] px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
          <ShieldAlert className="h-4 w-4" />
          No scan runs recorded
        </div>
        <h2 className="text-2xl font-black uppercase sm:text-3xl">Durable scans will appear here after they are queued.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-bold text-zinc-600">
          This ledger reports saved backend state only. It does not invent provider activity or results.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex border-4 border-black bg-[#FFE600] px-6 py-3 text-sm font-black uppercase shadow-[4px_4px_0_0_#000] hover:bg-yellow-300 active:translate-y-0.5"
        >
          Return to dashboard
        </Link>
      </div>
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
      <motion.div variants={item} className="relative flex items-center border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
        <Search className="absolute left-3.5 h-4 w-4 text-black/60 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH RUN ID, TRIGGER, OR STATUS..."
          className="w-full bg-transparent py-3 pl-10 pr-10 text-xs sm:text-sm font-black uppercase text-black placeholder:text-black/40 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 p-1 text-black/60 hover:text-black"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      <div className="space-y-4">
        {filteredRuns.map((run) => (
          <motion.div key={run.id} variants={item}>
            <Link
              href={`/app/runs/${run.id}`}
              className="group block border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0_0_#000]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <ScanStatusBadge status={run.status} />
                    <span className="border-2 border-black bg-[#FFE600] px-2.5 py-0.5 font-mono text-xs font-black shadow-[2px_2px_0_0_#000]">
                      RUN {shortScanRunId(run.id)}
                    </span>
                    <span className="border-2 border-black bg-black px-2 py-0.5 text-[11px] font-black uppercase text-white -rotate-1">
                      {run.trigger}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-black uppercase text-black">{run.statusMessage}</p>
                  <p className="mt-1.5 text-xs font-bold text-black/70 uppercase">{run.providerSummary}</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black/50">Last updated</p>
                  <p className="mt-0.5 text-xs font-black uppercase text-black">{formatScanTime(run.updatedAt)}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-black/50">
                    Completed: {formatScanTime(run.completedAt)}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-3 border-3 border-black bg-[#FFF8D9] shadow-[3px_3px_0_0_#000]">
                <Count label="Attempts" value={run.counts.providerAttempts} accent="bg-white" />
                <Count label="Returned" value={run.counts.providerResults} accent="bg-[#FFE600]" />
                <Count label="Source matches" value={run.counts.leadsCreated} accent="bg-[#06B6D4] text-black" />
              </dl>
            </Link>
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <motion.div variants={item} className="text-center pt-2">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="border-4 border-black bg-[#FFE600] px-6 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50 transition-all hover:bg-yellow-300"
          >
            {isPending ? 'Loading...' : 'Load older runs'}
          </button>
        </motion.div>
      )}
      {!hasMore && runs.length > 0 && (
        <motion.p variants={item} className="border-3 border-black bg-white p-3 text-center text-xs font-black uppercase shadow-[3px_3px_0_0_#000]">
          End of scan runs.
        </motion.p>
      )}
    </motion.div>
  )
}

function Count({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={`border-r-3 border-black p-3 last:border-r-0 ${accent || 'bg-white'}`}>
      <dt className="text-[10px] font-black uppercase text-black/60 tracking-wider">{label}</dt>
      <dd className="mt-1 text-xl sm:text-2xl font-black text-black">{value}</dd>
    </div>
  )
}
