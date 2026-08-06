import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Database, Gauge, Lock, Server, XCircle } from 'lucide-react'

export const metadata = {
  title: 'System Architecture Status | SEOlaQuest',
  description: 'Verified implementation status and unresolved production gates for SEOlaQuest.',
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
        <header className="border-4 border-outline bg-card p-7 shadow-brutal-lg sm:p-10">
          <span className="inline-flex items-center gap-2 border-2 border-outline bg-accent px-3 py-1 text-xs font-black uppercase shadow-brutal-sm">
            <Gauge size={15} /> Implementation status
          </span>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">Architecture without theatre</h1>
          <p className="mt-4 max-w-3xl text-sm font-bold leading-relaxed text-ink-muted sm:text-base">
            This is a code-status document, not a live status page. SEOlaQuest does not currently publish an uptime SLA,
            discovery-latency guarantee, edge-region benchmark, or production capacity number.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="border-4 border-outline bg-success p-5 shadow-brutal">
            <CheckCircle2 />
            <p className="mt-3 text-xs font-black uppercase">Local code gates</p>
            <p className="mt-1 text-2xl font-black uppercase">Implemented</p>
          </article>
          <article className="border-4 border-outline bg-highlight p-5 shadow-brutal">
            <AlertTriangle />
            <p className="mt-3 text-xs font-black uppercase">Production proof</p>
            <p className="mt-1 text-2xl font-black uppercase">Pending</p>
          </article>
          <article className="border-4 border-outline bg-[#FFB4A2] p-5 shadow-brutal">
            <XCircle />
            <p className="mt-3 text-xs font-black uppercase">Public SLA</p>
            <p className="mt-1 text-2xl font-black uppercase">Not offered</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="border-4 border-outline bg-card p-6 shadow-brutal-lg">
            <h2 className="flex items-center gap-2 text-xl font-black uppercase"><Server className="text-emerald-600" /> Present in the codebase</h2>
            <ul className="mt-5 space-y-3">
              {implemented.map((item) => (
                <li key={item} className="flex gap-3 border-2 border-outline bg-emerald-50 p-3 text-sm font-bold">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={17} /> {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="border-4 border-outline bg-card p-6 shadow-brutal-lg">
            <h2 className="flex items-center gap-2 text-xl font-black uppercase"><AlertTriangle className="text-amber-600" /> Blocks production claims</h2>
            <ul className="mt-5 space-y-3">
              {pending.map((item) => (
                <li key={item} className="flex gap-3 border-2 border-outline bg-amber-50 p-3 text-sm font-bold">
                  <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={17} /> {item}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="border-4 border-outline bg-black p-6 text-white shadow-[6px_6px_0_0_#A855F7] sm:p-8">
          <h2 className="text-xl font-black uppercase text-[#FFE600]">Current trust boundaries</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="border-2 border-hairline p-4"><Lock className="text-[#A855F7]" /><h3 className="mt-2 font-black uppercase">Identity</h3><p className="mt-1 text-xs font-bold text-ink-muted">Clerk session plus server-side tenant checks.</p></div>
            <div className="border-2 border-hairline p-4"><Database className="text-[#06B6D4]" /><h3 className="mt-2 font-black uppercase">State</h3><p className="mt-1 text-xs font-bold text-ink-muted">PostgreSQL is the source of truth for product and billing state.</p></div>
            <div className="border-2 border-hairline p-4"><Server className="text-[#A3E635]" /><h3 className="mt-2 font-black uppercase">Providers</h3><p className="mt-1 text-xs font-bold text-ink-muted">Optional provider failures return unavailable or empty results, not demo records.</p></div>
          </div>
        </section>

        <nav className="flex flex-wrap gap-3 border-t-4 border-outline pt-6 text-xs font-black uppercase">
          <Link href="/" className="border-2 border-outline bg-card px-4 py-2 shadow-brutal-sm">Home</Link>
          <Link href="/privacy" className="border-2 border-outline bg-card px-4 py-2 shadow-brutal-sm">Privacy</Link>
          <Link href="/api-terms" className="border-2 border-outline bg-card px-4 py-2 shadow-brutal-sm">API status</Link>
        </nav>
      </div>
    </main>
  )
}
