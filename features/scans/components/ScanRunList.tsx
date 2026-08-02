import Link from 'next/link'
import { formatScanTime, shortScanRunId } from '../scanView'
import type { ScanRunListResult } from '../types'
import { ScanStatusBadge } from './ScanStatusBadge'

export function ScanRunList({ runs, hasMore }: ScanRunListResult) {
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
      {hasMore && (
        <p className="border-2 border-black bg-zinc-100 p-3 text-center text-xs font-black uppercase">
          Showing the 100 most recently updated scan runs.
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
