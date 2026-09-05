import { requireAdminPage } from '../access'
import Link from 'next/link'
import { AdminService } from '@/src/modules/admin/AdminService'
import { PauseScheduleButton } from '../PauseScheduleButton'

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAdminPage()
  const params = await searchParams
  const search = typeof params.q === 'string' ? params.q.slice(0, 120) : ''
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1))
  const data = await AdminService.users(search, page)
  const pageUrl = (next: number) => `/app/admin/users?${new URLSearchParams({ q: search, page: String(next) })}`
  return <div className="space-y-5">
    <h2 className="text-xl font-semibold">Users <span className="text-ink-muted">({data.total})</span></h2>
    <form className="flex flex-wrap gap-2" action="/app/admin/users">
      <label className="sr-only" htmlFor="admin-user-search">Search users by name or email</label>
      <input id="admin-user-search" name="q" defaultValue={search} maxLength={120} placeholder="Search name or email"
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-outline bg-card px-3" />
      <button className="min-h-11 rounded-lg border border-outline px-4 font-semibold">Search</button>
    </form>
    <div className="overflow-x-auto rounded-xl border border-outline bg-card">
      <table className="w-full text-left text-sm"><caption className="sr-only">Registered users, subscriptions and scheduled scans</caption>
        <thead><tr>{['User', 'Joined', 'Plan', 'Credits', 'Matches', 'Scanning'].map(label =>
          <th scope="col" key={label} className="border-b border-outline p-3">{label}</th>)}</tr></thead>
        <tbody>{data.users.map(user => <tr key={user.id}>
          <td className="border-b border-outline p-3"><p className="font-semibold">{user.name ?? 'No name'}</p><p>{user.email}</p>
            <p className="text-xs text-ink-muted">{user.onboardingComplete ? 'Onboarded' : 'Onboarding incomplete'}</p></td>
          <td className="border-b border-outline p-3 whitespace-nowrap">{user.createdAt.toISOString().slice(0, 10)}</td>
          <td className="border-b border-outline p-3">{user.billingSubscription?.plan ?? 'FREE'}<br /><span className="text-xs">{user.billingSubscription?.status ?? 'No subscription'}</span></td>
          <td className="border-b border-outline p-3 tabular-nums">{user.questsRemaining}</td>
          <td className="border-b border-outline p-3">{user._count.leads} · {user._count.keywords} keywords</td>
          <td className="border-b border-outline p-3">{user.scanSchedule?.enabled ? <PauseScheduleButton userId={user.id} /> : 'Schedule off'}</td>
        </tr>)}</tbody>
      </table>
      {!data.users.length && <p className="p-5 text-ink-muted">No users match this search.</p>}
    </div>
    <nav aria-label="User list pages" className="flex min-h-11 items-center gap-5">
      {page > 1 && <Link href={pageUrl(page - 1)} className="underline">Previous</Link>}
      <span>Page {page}</span>
      {page * 25 < data.total && <Link href={pageUrl(page + 1)} className="underline">Next</Link>}
    </nav>
  </div>
}
