import Link from 'next/link'
import { formatScanTime } from '../scanView'
import type { ScanRunView } from '../types'
import { ScanStatusBadge } from './ScanStatusBadge'

export function ScanRunDetail({ run }: { run: ScanRunView }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-black pb-5">
          <ScanStatusBadge status={run.status} />
          <Link href="/app/runs" className="text-sm font-black uppercase underline decoration-2 underline-offset-4">
            Back to scan runs
          </Link>
        </div>

        <h1 className="mt-6 text-3xl font-black uppercase sm:text-4xl">Durable scan run</h1>
        <p className="mt-3 max-w-2xl font-bold text-zinc-700">{run.statusMessage}</p>

        {run.customerError && (
          <div role="status" className="mt-5 border-2 border-black bg-orange-100 p-4 font-bold text-zinc-800">
            {run.customerError}
          </div>
        )}

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <DetailItem label="Run ID" value={run.id} mono />
          <DetailItem label="Trigger" value={run.trigger} />
          <DetailItem label="Created" value={formatScanTime(run.createdAt)} />
          <DetailItem label="Last updated" value={formatScanTime(run.updatedAt)} />
          <DetailItem label="Completed" value={formatScanTime(run.completedAt)} />
          <DetailItem label="Provider health" value={run.providerHealth.replaceAll('_', ' ')} />
        </dl>

        <section className="mt-6 border-4 border-black bg-zinc-50 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Provider-safe summary</p>
          <h2 className="mt-2 text-xl font-black uppercase">Recorded results only</h2>
          <p className="mt-2 font-bold text-zinc-700">{run.providerSummary}</p>
          <dl className="mt-5 grid grid-cols-3 border-2 border-black bg-white">
            <Count label="Attempts" value={run.counts.providerAttempts} />
            <Count label="Returned" value={run.counts.providerResults} />
            <Count label="Source matches" value={run.counts.leadsCreated} />
          </dl>
        </section>
      </section>

      <aside className="h-fit border-4 border-black bg-[#F4F0EA] p-5 shadow-[6px_6px_0_0_#000]">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Refund truth</p>
        <h2 className="mt-2 text-xl font-black uppercase">
          {run.refunded ? 'Refund recorded' : 'No refund recorded'}
        </h2>
        <p className="mt-3 text-sm font-bold text-zinc-700">{run.refundMessage}</p>
        {run.currentBalance !== null && (
          <div className="mt-5 border-2 border-black bg-white p-4">
            <p className="text-xs font-black uppercase text-zinc-500">Current scan credits</p>
            <p className="mt-1 text-3xl font-black">{run.currentBalance}</p>
            <p className="mt-1 text-xs font-bold text-zinc-600">Current account balance, not the balance at completion.</p>
          </div>
        )}
      </aside>
    </div>
  )
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 border-2 border-black bg-zinc-50 p-4">
      <dt className="text-xs font-black uppercase text-zinc-500">{label}</dt>
      <dd className={`mt-1 break-words font-bold ${mono ? 'font-mono text-sm' : ''}`}>{value}</dd>
    </div>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r-2 border-black p-3 last:border-r-0">
      <dt className="text-xs font-black uppercase text-zinc-500">{label}</dt>
      <dd className="mt-1 text-2xl font-black">{value}</dd>
    </div>
  )
}
