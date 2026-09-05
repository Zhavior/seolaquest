import Link from 'next/link'
import { OutcomeControls } from '@/app/app/leads/OutcomeControls'
import type { ScanRunView } from '@/features/scans/types'

type Pipeline = {
  stages: Record<string, number>
  reports: Record<string, number>
  followUps: { id: string; content: string; status: string }[]
}
const stages = [['CLAIMED', 'Claimed'], ['CONTACTED', 'Contacted'], ['REPLIED', 'Replied'], ['QUALIFIED', 'Qualified'], ['CONVERTED', 'Converted']] as const
export function OutcomeWorkspace({ pipeline, scans, checkedAt }: {
  pipeline: Pipeline | null; scans: ScanRunView[] | null; checkedAt: string
}) {
  return <section aria-labelledby="outcome-workspace" className="space-y-5 rounded-[20px] border border-outline bg-card p-4 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs uppercase tracking-widest text-ink-muted">Your customer pipeline</p>
        <h2 id="outcome-workspace" className="font-display text-2xl sm:text-3xl">Turn conversations into progress.</h2>
        <p className="mt-2 text-sm text-ink-muted">Saved snapshot · <time dateTime={checkedAt}>{checkedAt.replace('T', ' ').slice(0, 16)} UTC</time></p>
      </div><Link href="/app/leads" className="inline-flex min-h-11 items-center underline">All follow-ups →</Link>
    </header>
    {pipeline ? <>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">{stages.map(([key, label]) => <div key={key} className="rounded-xl bg-canvas p-3">
        <dt className="text-sm text-ink-muted">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{pipeline.stages[key] ?? 0}</dd>
      </div>)}</dl>
      <p className="text-xs text-ink-muted">Current stages, not a conversion funnel. Older records may have no supporting outcome history.</p>
      <div className="rounded-xl border border-hairline p-4">
        <h3 className="font-semibold">Customer-reported results · all time</h3>
        <p className="mt-2 text-sm">{pipeline.reports.REPLY ?? 0} replies · {pipeline.reports.QUALIFY ?? 0} qualified · {pipeline.reports.CONVERT ?? 0} conversions</p>
        <p className="mt-1 text-xs text-ink-muted">Recorded reports only. These are not verified sales or revenue.</p>
      </div>
    </> : <p role="status">Pipeline unavailable. Counts could not be loaded.</p>}
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="min-w-0 space-y-3"><h3 className="font-display text-xl">Next follow-ups</h3>
        {pipeline && !pipeline.followUps.length && <p className="text-sm text-ink-muted">Claim a lead from the review queue to start following up.</p>}
        {pipeline?.followUps.map(lead => <details key={lead.id} className="rounded-xl border border-hairline p-3">
          <summary className="min-h-11 cursor-pointer break-words text-sm"><span className="font-semibold">{lead.status.toLowerCase()}</span> · {lead.content.slice(0, 180)}{lead.content.length > 180 ? '…' : ''}</summary>
          <div className="mt-3"><OutcomeControls key={lead.status} leadId={lead.id} status={lead.status} /></div>
        </details>)}
        {pipeline && pipeline.followUps.length > 0 && <p className="text-xs text-ink-muted">Three newest leads still in progress.</p>}
      </div>
      <div className="min-w-0 space-y-3"><h3 className="font-display text-xl">Recent scans</h3>
        {scans === null ? <p role="status">Scan history unavailable.</p> : !scans.length ? <p className="text-sm text-ink-muted">No saved scans yet. Start a scan from your dashboard.</p> : scans.slice(0, 3).map(run => <Link key={run.id} href={`/app/runs/${run.id}`} className="block rounded-xl border border-hairline p-3">
          <span className="text-sm font-semibold">{run.status.replaceAll('_', ' ')}</span>
          <p className="mt-1 text-sm">{run.statusMessage}</p><p className="mt-1 text-xs text-ink-muted">{run.providerSummary}</p>
          <p className="mt-2 text-xs">{run.counts.leadsCreated} saved leads · <time dateTime={run.updatedAt}>{run.updatedAt.replace('T', ' ').slice(0, 16)} UTC</time></p>
        </Link>)}
        <Link href="/app/runs" className="inline-flex min-h-11 items-center text-sm underline">Open scan history for current status →</Link>
      </div>
    </div>
  </section>
}
