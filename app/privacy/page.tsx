import Link from 'next/link'
import { Database, ExternalLink, Lock, ShieldAlert, Trash2, UserRound } from 'lucide-react'

export const metadata = {
  title: 'Privacy & Data Handling | SEOlaQuest',
  description: 'A plain-language account of the data SEOlaQuest currently stores and the controls still pending.',
  alternates: { canonical: '/privacy' },
}

const storedData = [
  {
    title: 'Account identity',
    body: 'Clerk authenticates the account. SEOlaQuest stores the verified email, display name, and product settings needed to associate application data with that account.',
  },
  {
    title: 'Product data',
    body: 'Tracked keywords, discovered public posts, lead workflow state, CRM configuration, and measured product activity are stored in PostgreSQL.',
  },
  {
    title: 'Billing state',
    body: 'Stripe handles payment details. SEOlaQuest stores Stripe identifiers, subscription state, checkout attempts, webhook processing records, and its own credit ledger.',
  },
  {
    title: 'Optional providers',
    body: 'When configured, social-data and AI providers receive only the request data needed for the selected feature. Their availability depends on deployment configuration.',
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="relative overflow-hidden rounded-[20px] border border-outline bg-card p-7 sm:p-10">
          <Lock className="absolute -right-8 -top-8 h-44 w-44 text-forest opacity-10" />
          <div className="relative space-y-4">
            <span className="inline-flex items-center gap-2 rounded-xl border border-outline bg-info px-3 py-1 text-xs font-semibold text-on-accent">
              <ShieldAlert size={15} /> Truth-first privacy notice
            </span>
            <h1 className="font-display max-w-3xl text-4xl font-medium leading-none tracking-tight sm:text-6xl">
              What SEOlaQuest stores today
            </h1>
            <p className="max-w-3xl text-sm font-medium leading-relaxed text-ink-muted sm:text-base">
              This page describes the current application behavior. It does not claim certifications, storage regions,
              retention periods, or deletion guarantees that have not been verified for the deployed environment.
            </p>
            <p className="text-xs font-semibold text-ink-muted">Reviewed July 29, 2026</p>
          </div>
        </header>

        <section className="rounded-[20px] border border-outline bg-card p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-outline pb-4">
            <Database className="text-forest" />
            <h2 className="font-display text-2xl font-medium">Data categories</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {storedData.map((item) => (
              <article key={item.title} className="rounded-[20px] border border-outline bg-canvas p-5">
                <h3 className="font-display font-medium">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-ink-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border border-outline bg-highlight p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Trash2 className="text-red-600" />
            <h2 className="font-display text-2xl font-medium">Deletion requests are pending work</h2>
          </div>
          <div className="space-y-4 text-sm font-medium leading-relaxed text-ink">
            <p>
              The Settings area contains the real account-deletion request control. A submitted request means the request
              is pending; it is not a promise that every application, identity-provider, billing, backup, and log record was
              immediately purged.
            </p>
            <p>
              Completion must be handled by the backend workflow and confirmed separately. Until that end-to-end workflow
              is deployed and verified, SEOlaQuest must not describe deletion as instant or automatic.
            </p>
            <Link
              href="/app/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-outline bg-accent-2 px-5 py-3 text-xs font-semibold text-on-accent hover:bg-accent"
            >
              <UserRound size={16} /> Open account settings <ExternalLink size={14} />
            </Link>
          </div>
        </section>

        <section className="rounded-[20px] border border-outline bg-forest p-6 text-on-forest sm:p-8">
          <h2 className="font-display text-xl font-medium text-accent">Current privacy safeguards</h2>
          <ul className="mt-4 grid gap-3 text-sm font-medium text-on-forest/85 md:grid-cols-2">
            <li className="border border-hairline p-4">Server operations re-check the authenticated account and tenant ownership.</li>
            <li className="border border-hairline p-4">API responses use bounded data-transfer objects instead of complete database rows.</li>
            <li className="border border-hairline p-4">The core logger redacts common identity, credential, and free-text fields.</li>
            <li className="border border-hairline p-4">Payment-card details are not stored in the SEOlaQuest application database.</li>
          </ul>
        </section>

        <nav className="flex flex-wrap gap-3 border-t border-outline pt-6 text-xs font-semibold">
          <Link href="/" className="rounded-xl border border-outline bg-card px-4 py-2">Home</Link>
          <Link href="/terms" className="rounded-xl border border-outline bg-card px-4 py-2">Terms</Link>
          <Link href="/specs" className="rounded-xl border border-outline bg-card px-4 py-2">System status</Link>
        </nav>
      </div>
    </main>
  )
}
