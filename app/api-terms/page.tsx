import Link from 'next/link'
import { Ban, CheckCircle2, KeyRound, Lock, RadioTower } from 'lucide-react'

export const metadata = {
  title: 'API Availability | SEOlaQuest',
  description: 'The current, fail-closed status of SEOlaQuest API access and automation.',
  alternates: { canonical: '/api-terms' },
}

export default function ApiTermsPage() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[20px] border border-outline bg-card p-7 sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-xl border border-outline bg-forest px-3 py-1 text-xs font-semibold text-on-forest">
            <Lock size={15} /> Fail-closed developer status
          </span>
          <h1 className="font-display mt-4 text-4xl font-medium leading-none tracking-tight sm:text-6xl">Public API access is unavailable</h1>
          <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-ink-muted sm:text-base">
            SEOlaQuest does not currently issue working bearer keys or offer a supported third-party REST API. There are no
            published request quotas, API tiers, webhook-delivery SLAs, or enterprise capacity guarantees.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[20px] border border-outline bg-danger/15 p-6">
            <Ban size={30} />
            <h2 className="font-display mt-3 text-xl font-medium">Not available</h2>
            <ul className="mt-4 space-y-2 text-sm font-medium">
              <li>Bearer-key creation, rotation, or revocation</li>
              <li>External scout-trigger endpoints</li>
              <li>Developer quotas or paid API packages</li>
              <li>Guaranteed webhook delivery or response time</li>
            </ul>
          </article>
          <article className="rounded-[20px] border border-outline bg-success p-6">
            <CheckCircle2 size={30} />
            <h2 className="font-display mt-3 text-xl font-medium">Current product behavior</h2>
            <ul className="mt-4 space-y-2 text-sm font-medium">
              <li>Interactive routes use Clerk-authenticated product sessions.</li>
              <li>Stripe and cron routes authenticate their own machine requests.</li>
              <li>Configured CRM URLs receive outbound exports from the product.</li>
              <li>Scan credits are enforced by server-owned entitlement state.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-[20px] border border-outline bg-forest p-6 text-on-forest sm:p-8">
          <div className="flex items-center gap-3"><KeyRound className="text-accent" /><h2 className="font-display text-xl font-medium">What `/keys` means today</h2></div>
          <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-on-forest/85">
            The key page is an unavailable-state screen. Any legacy values held in browser storage were demonstration data,
            are not server credentials, and are not accepted for authentication.
          </p>
          <Link href="/app/keys" className="mt-5 inline-flex items-center gap-2 border border-white bg-accent px-5 py-3 text-xs font-semibold text-on-accent">
            <KeyRound size={16} /> View key status
          </Link>
        </section>

        <section className="rounded-[20px] border border-outline bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3"><RadioTower className="text-forest" /><h2 className="font-display text-xl font-medium">Launch requirements</h2></div>
          <p className="mt-3 text-sm font-medium text-ink-muted">
            A public API requires a real credential store, scoped authorization, revocation, abuse controls, audit records,
            documented schemas, versioning, monitoring, and adversarial tests. Pricing and SLAs can be published only after
            those controls are deployed and measured.
          </p>
        </section>

        <nav className="flex flex-wrap gap-3 border-t border-outline pt-6 text-xs font-semibold">
          <Link href="/" className="rounded-xl border border-outline bg-card px-4 py-2">Home</Link>
          <Link href="/specs" className="rounded-xl border border-outline bg-card px-4 py-2">Architecture status</Link>
          <Link href="/app/billing" className="rounded-xl border border-outline bg-card px-4 py-2">Billing</Link>
        </nav>
      </div>
    </main>
  )
}
