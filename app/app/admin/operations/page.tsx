import { requireAdminPage } from '../access'
import { AdminService } from '@/src/modules/admin/AdminService'

export default async function AdminOperationsPage() {
  await requireAdminPage()
  const data = await AdminService.operations()
  const sections = [
    { title: 'Durable jobs · current state', rows: data.jobs.map(row => [`${row.status}`, row._count._all]) },
    { title: 'Provider attempts · past 24 hours', rows: data.providerAttempts.map(row => [`${row.provider} · ${row.outcome}`, row._count._all]) },
    { title: 'Aurora evaluations · all time', rows: data.decisions.map(row => [`${row.policyVersion} · ${row.evaluationStatus}`, row._count._all]) },
    { title: 'Recorded outcome actions · all time', rows: data.outcomes.map(row => [`${row.action} · ${row.evidenceKind}`, row._count._all]) },
  ]
  return <div className="space-y-8">
    <p className="text-sm text-ink-muted">Database observations. Customer reports are not independently verified conversions.</p>
    <div className="grid gap-5 md:grid-cols-2">{sections.map(section => <section key={section.title} className="rounded-xl border border-outline bg-card p-5">
      <h2 className="mb-4 font-semibold">{section.title}</h2>
      <dl className="space-y-2">{section.rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 text-sm"><dt>{label}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>)}</dl>
      {!section.rows.length && <p className="text-sm text-ink-muted">No records.</p>}
    </section>)}</div>
    <section><h2 className="mb-3 text-lg font-semibold">Failed work · latest 25 in each queue</h2>
      <p className="mb-3 text-sm text-ink-muted">Inspect the cause before retrying work that may spend customer credits or repeat external delivery.</p>
      <ul className="space-y-2 text-sm">{data.failedJobs.map(job => <li key={job.id} className="rounded-lg border border-outline bg-card p-3">
        <strong>{job.kind}</strong> · {job.attempts} attempts · {job.lastErrorCode ?? 'No error code'}<br /><span className="break-all text-xs">{job.id}</span>
      </li>)}{data.failedEvents.map(event => <li key={event.id} className="rounded-lg border border-outline bg-card p-3">
        <strong>{event.type}</strong> · {event.attempts} attempts<br /><span className="break-all text-xs">{event.id}</span>
      </li>)}</ul>
      {!data.failedJobs.length && !data.failedEvents.length && <p className="text-sm text-ink-muted">No terminal failures recorded.</p>}
    </section>
    <section><h2 className="mb-3 text-lg font-semibold">Admin audit · latest 25 actions</h2>
      <ul className="space-y-2 text-sm">{data.audit.map(entry => <li key={entry.id} className="rounded-lg border border-outline bg-card p-3">
        {entry.action} · {entry.status} · {entry.createdAt.toISOString()}<br /><span className="break-all text-xs">{entry.entityId}</span>
      </li>)}</ul>{!data.audit.length && <p className="text-sm text-ink-muted">No admin changes recorded.</p>}
    </section>
  </div>
}
