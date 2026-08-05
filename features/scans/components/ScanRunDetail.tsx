import Link from 'next/link'
import { QuestCountGrid, QuestPanel, questSurface } from '@/components/quest'
import { formatScanTime } from '../scanView'
import type { ScanRunView } from '../types'
import { ScanStatusBadge } from './ScanStatusBadge'

export function ScanRunDetail({ run }: { run: ScanRunView }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <QuestPanel as="section" shadow="xl" padding="none" className="p-6" aria-labelledby="scan-run-heading">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-outline pb-5">
          <ScanStatusBadge status={run.status} />
          <Link
            href="/app/runs"
            className="inline-flex min-h-11 items-center text-sm font-black uppercase underline decoration-2 underline-offset-4"
          >
            Back to scan runs
          </Link>
        </div>

        <h1 id="scan-run-heading" className="mt-6 text-3xl font-black uppercase sm:text-4xl">
          Durable scan run
        </h1>
        <p className="mt-3 max-w-2xl font-bold text-ink-muted">{run.statusMessage}</p>

        {run.customerError && (
          <div role="status" className="mt-5 border-2 border-outline bg-orange-100 p-4 font-bold text-ink">
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

        <QuestPanel as="section" tone="muted" shadow="none" padding="none" className="mt-6 p-5" aria-labelledby="provider-summary-heading">
          <p className="text-xs font-black uppercase tracking-widest text-ink-muted">Provider-safe summary</p>
          <h2 id="provider-summary-heading" className="mt-2 text-xl font-black uppercase">
            Recorded results only
          </h2>
          <p className="mt-2 font-bold text-ink-muted">{run.providerSummary}</p>
          <QuestCountGrid
            className="mt-5"
            tone="white"
            border={2}
            shadow="none"
            size="sm"
            counts={[
              { label: 'Attempts', value: run.counts.providerAttempts },
              { label: 'Returned', value: run.counts.providerResults },
              { label: 'Source matches', value: run.counts.leadsCreated },
            ]}
          />
        </QuestPanel>
      </QuestPanel>

      <QuestPanel as="aside" tone="parchment" padding="none" className="h-fit p-5" aria-labelledby="refund-truth-heading">
        <p className="text-xs font-black uppercase tracking-widest text-ink-muted">Refund truth</p>
        <h2 id="refund-truth-heading" className="mt-2 text-xl font-black uppercase">
          {run.refunded ? 'Refund recorded' : 'No refund recorded'}
        </h2>
        <p className="mt-3 text-sm font-bold text-ink-muted">{run.refundMessage}</p>
        {run.currentBalance !== null && (
          <div className={questSurface({ border: 2, shadow: 'none', className: 'mt-5 p-4' })}>
            <p className="text-xs font-black uppercase text-ink-muted">Current scan credits</p>
            <p className="mt-1 text-3xl font-black">{run.currentBalance}</p>
            <p className="mt-1 text-xs font-bold text-ink-muted">
              Current account balance, not the balance at completion.
            </p>
          </div>
        )}
      </QuestPanel>
    </div>
  )
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className={questSurface({ tone: 'muted', border: 2, shadow: 'none', className: 'p-4' })}>
      <dt className="text-xs font-black uppercase text-ink-muted">{label}</dt>
      <dd className={`mt-1 break-word-safe font-bold ${mono ? 'font-mono text-sm' : ''}`}>{value}</dd>
    </div>
  )
}
