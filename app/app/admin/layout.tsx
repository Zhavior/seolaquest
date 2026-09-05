import Link from 'next/link'
import { requireAdminPage } from './access'

export const dynamic = 'force-dynamic'
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()
  return <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 text-ink">
    <header className="border-b border-outline pb-5">
      <p className="text-xs font-bold normal-case tracking-wide text-ink-muted">Owner workspace</p>
      <h1 className="mt-1 text-3xl font-bold">Admin Mode</h1>
      <nav aria-label="Admin navigation" className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/app/admin" className="underline underline-offset-4">Overview</Link>
        <Link href="/app/admin/users" className="underline underline-offset-4">Users</Link>
        <Link href="/app/admin/operations" className="underline underline-offset-4">Operations</Link>
        <Link href="/app/admin/aurora" className="underline underline-offset-4">Aurora evidence</Link>
      </nav>
    </header>
    {children}
  </section>
}
