import { requireAdminPage } from './access'
import Link from 'next/link'
import { AdminService } from '@/src/modules/admin/AdminService'

export default async function AdminPage() {
  await requireAdminPage()
  const counts = await AdminService.overview()
  const metrics = [ ['Total users', counts.users], ['Onboarding completed', counts.onboarded],
    ['Active paid subscriptions', counts.activeSubscriptions], ['New users · past 24 hours', counts.newUsers],
    ['Stored source matches', counts.leads], ['Recorded outcome actions', counts.outcomes],
    ['Enabled scan schedules', counts.enabledSchedules] ] as const
  return <div className="space-y-6">
    <p className="text-sm text-ink-muted">Current database counts. Subscription counts do not establish collected revenue.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label, value]) =>
      <article key={label} className="rounded-xl border border-outline bg-card p-5">
        <h2 className="text-sm text-ink-muted">{label}</h2><p className="mt-2 text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
      </article>)}</div>
    <div className="flex flex-wrap gap-4">
      <Link href="/app/admin/users" className="inline-flex min-h-11 items-center rounded-lg border border-outline bg-card px-4 font-semibold">Manage users</Link>
      <Link href="/app/admin/operations" className="inline-flex min-h-11 items-center rounded-lg border border-outline bg-card px-4 font-semibold">Inspect operations</Link>
    </div>
  </div>
}
