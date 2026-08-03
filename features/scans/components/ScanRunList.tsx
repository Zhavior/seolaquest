'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { formatScanTime, shortScanRunId } from '../scanView'
import type { ScanRunListResult, ScanRunView } from '../types'
import { ScanStatusBadge } from './ScanStatusBadge'
import { loadMoreScanRunsAction, pollPendingScanRunsAction } from '../actions'

export function ScanRunList({ runs: initialRuns, hasMore: initialHasMore }: ScanRunListResult) {
  const [runs, setRuns] = useState<ScanRunView[]>(initialRuns)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isPending, startTransition] = useTransition()

  // Poll for pending runs
  useEffect(() => {
    const pendingIds = runs.filter(r => r.status === 'QUEUED' || r.status === 'RUNNING').map(r => r.id)
    if (pendingIds.length === 0) return

    const interval = setInterval(() => {
      pollPendingScanRunsAction(pendingIds).then((updates) => {
        if (updates.length > 0) {
          setRuns(currentRuns => {
            const updated = [...currentRuns]
            let changed = false
            updates.forEach(u => {
              const index = updated.findIndex(r => r.id === u.id)
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
      setRuns(current => [...current, ...result.runs])
      setHasMore(result.hasMore)
    })
  }

  if (runs.length === 0) {
    return (
      <section className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0_0_#000]">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">No scan runs yet</p>
        <h2 className="mt-3 text-2xl font-black uppercase">Durable scans will appear here after they are queued.</h2>
        <p className="mx-auto mt-3 max-w-xl font-bold text-zinc-600">
          This ledger reports saved backend state only. It does not invent provider activity or results.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex border-4 border-black bg-[#FFE600] px-5 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] hover:bg-yellow-300"
        >
          Return to dashboard
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {runs.map((run) => (
          <Link
            key={run.id}
            href={`/app/runs/${run.id}`}
            className="block border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000] transition-transform hover:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <ScanStatusBadge status={run.status} />
                  <p className="font-mono text-sm font-black">Run {shortScanRunId(run.id)}</p>
                  <span className="text-xs font-black uppercase text-zinc-500">{run.trigger}</span>
                </div>
                <p className="mt-3 text-sm font-bold text-zinc-700">{run.statusMessage}</p>
                <p className="mt-2 text-xs font-bold text-zinc-600">{run.providerSummary}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-black uppercase text-zinc-500">Updated</p>
                <p className="mt-1 text-sm font-bold">{formatScanTime(run.updatedAt)}</p>
                <p className="mt-2 text-xs font-black uppercase text-zinc-500">
                  Completed {formatScanTime(run.completedAt)}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-3 border-2 border-black bg-zinc-50">
              <Count label="Attempts" value={run.counts.providerAttempts} />
              <Count label="Returned" value={run.counts.providerResults} />
              <Count label="Source matches" value={run.counts.leadsCreated} />
            </dl>
          </Link>
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="border-4 border-black bg-white px-6 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_0px_0_0_#000] disabled:opacity-50 transition-all"
          >
            {isPending ? 'Loading...' : 'Load older runs'}
          </button>
        </div>
      )}
      {!hasMore && runs.length > 0 && (
        <p className="border-2 border-black bg-zinc-100 p-3 text-center text-xs font-black uppercase">
          End of scan runs.
        </p>
      )}
    </div>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r-2 border-black p-3 last:border-r-0">
      <dt className="text-[0.65rem] font-black uppercase text-zinc-500 sm:text-xs">{label}</dt>
      <dd className="mt-1 text-xl font-black">{value}</dd>
    </div>
  )
}
