import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Database, Gauge, Lock, Server, XCircle } from 'lucide-react'

export const metadata = {
  title: 'System Architecture Status | SEOlaQuest',
  description: 'Verified implementation status and unresolved production gates for SEOlaQuest.',
  // /status is the live URL for this content: proxy.ts 308-redirects /specs to
  // /status, so /specs never actually renders in production. The canonical must
  // name the URL that answers 200, not the one that bounces.
  alternates: { canonical: '/status' },
}

const implemented = [
  'Next.js App Router with TypeScript and server-side authorization boundaries',
  'PostgreSQL access through Prisma with tenant-scoped application queries',
  'Clerk session authentication for interactive product routes',
  'Stripe Checkout and signed webhook processing behind disabled-by-default launch switches',
  'Webhook inbox, idempotent credit ledger, entitlement checks, and SSRF-resistant CRM delivery',
]

const pending = [
  'Production database backup and restore rehearsal',
  'Signed Stripe sandbox replay against the deployed preview',
  'Published uptime and latency objectives backed by monitoring data',
  'Runtime rate limiting, durable operational alerting, and dead-letter response',
  'Verified end-to-end account deletion across application, Clerk, Stripe, backups, and logs',
]

export default function SpecsPage() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[20px] border border-outline bg-card p-7 sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-xl border border-outline bg-accent px-3 py-1 text-xs font-semibold">
            <Gauge size={15} /> Implementation status
          </span>
          <h1 className="font-display mt-4 text-4xl font-medium leading-none tracking-tight sm:text-6xl">Architecture without theatre</h1>
          <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-ink-muted sm:text-base">
            This is a code-status document, not a live status page. SEOlaQuest does not currently publish an uptime SLA,
            discovery-latency guarantee, edge-region benchmark, or production capacity number.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-[20px] border border-outline bg-success p-5">
            <CheckCircle2 />
            <p className="mt-3 text-xs font-semibold">Local code gates</p>
            <p className="mt-1 text-2xl font-semibold">Implemented</p>
          </article>
          <article className="rounded-[20px] border border-outline bg-highlight p-5">
            <AlertTriangle />
            <p className="mt-3 text-xs font-semibold">Production proof</p>
            <p className="mt-1 text-2xl font-semibold">Pending</p>
          </article>
          <article className="rounded-[20px] border border-outline bg-danger/15 p-5">
            <XCircle />
            <p className="mt-3 text-xs font-semibold">Public SLA</p>
            <p className="mt-1 text-2xl font-semibold">Not offered</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[20px] border border-outline bg-card p-6">
            <h2 className="font-display flex items-center gap-2 text-xl font-medium"><Server className="text-emerald-600" /> Present in the codebase</h2>
            <ul className="mt-5 space-y-3">
              {implemented.map((item) => (
                <li key={item} className="flex gap-3 rounded-xl border border-outline bg-emerald-50 p-3 text-sm font-medium">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={17} /> {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[20px] border border-outline bg-card p-6">
            <h2 className="font-display flex items-center gap-2 text-xl font-medium"><AlertTriangle className="text-amber-600" /> Blocks production claims</h2>
            <ul className="mt-5 space-y-3">
              {pending.map((item) => (
                <li key={item} className="flex gap-3 rounded-xl border border-outline bg-amber-50 p-3 text-sm font-medium">
                  <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={17} /> {item}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-[20px] border border-outline bg-forest p-6 text-on-forest sm:p-8">
          <h2 className="font-display text-xl font-medium text-accent">Current trust boundaries</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="border border-hairline p-4"><Lock className="text-accent" /><h3 className="font-display mt-2 font-medium">Identity</h3><p className="mt-1 text-xs font-medium text-on-forest/80">Clerk session plus server-side tenant checks.</p></div>
            <div className="border border-hairline p-4"><Database className="text-accent" /><h3 className="font-display mt-2 font-medium">State</h3><p className="mt-1 text-xs font-medium text-on-forest/80">PostgreSQL is the source of truth for product and billing state.</p></div>
            <div className="border border-hairline p-4"><Server className="text-on-forest" /><h3 className="font-display mt-2 font-medium">Providers</h3><p className="mt-1 text-xs font-medium text-on-forest/80">Optional provider failures return unavailable or empty results, not demo records.</p></div>
          </div>
        </section>

        <nav className="flex flex-wrap gap-3 border-t border-outline pt-6 text-xs font-semibold">
          <Link href="/" className="rounded-xl border border-outline bg-card px-4 py-2">Home</Link>
          <Link href="/privacy" className="rounded-xl border border-outline bg-card px-4 py-2">Privacy</Link>
          <Link href="/api-terms" className="rounded-xl border border-outline bg-card px-4 py-2">API status</Link>
        </nav>
      </div>
    </main>
  )
}
