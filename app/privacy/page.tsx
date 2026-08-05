import Link from 'next/link'
import { Database, ExternalLink, Lock, ShieldAlert, Trash2, UserRound } from 'lucide-react'

export const metadata = {
  title: 'Privacy & Data Handling | SEO la Quest',
  description: 'A plain-language account of the data SEO la Quest currently stores and the controls still pending.',
}

const storedData = [
  {
    title: 'Account identity',
    body: 'Clerk authenticates the account. SEO la Quest stores the verified email, display name, and product settings needed to associate application data with that account.',
  },
  {
    title: 'Product data',
    body: 'Tracked keywords, discovered public posts, lead workflow state, CRM configuration, and measured product activity are stored in PostgreSQL.',
  },
  {
    title: 'Billing state',
    body: 'Stripe handles payment details. SEO la Quest stores Stripe identifiers, subscription state, checkout attempts, webhook processing records, and its own credit ledger.',
  },
  {
    title: 'Optional providers',
    body: 'When configured, social-data and AI providers receive only the request data needed for the selected feature. Their availability depends on deployment configuration.',
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F4F0EA] px-4 py-10 text-black sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="relative overflow-hidden border-4 border-black bg-white p-7 shadow-[8px_8px_0_0_#000] sm:p-10">
          <Lock className="absolute -right-8 -top-8 h-44 w-44 text-[#06B6D4] opacity-10" />
          <div className="relative space-y-4">
            <span className="inline-flex items-center gap-2 border-2 border-black bg-[#06B6D4] px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000]">
              <ShieldAlert size={15} /> Truth-first privacy notice
            </span>
            <h1 className="max-w-3xl text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
              What SEO la Quest stores today
            </h1>
            <p className="max-w-3xl text-sm font-bold leading-relaxed text-zinc-700 sm:text-base">
              This page describes the current application behavior. It does not claim certifications, storage regions,
              retention periods, or deletion guarantees that have not been verified for the deployed environment.
            </p>
            <p className="text-xs font-black uppercase text-zinc-500">Reviewed July 29, 2026</p>
          </div>
        </header>

        <section className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000] sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b-4 border-black pb-4">
            <Database className="text-[#A855F7]" />
            <h2 className="text-2xl font-black uppercase">Data categories</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {storedData.map((item) => (
              <article key={item.title} className="border-3 border-black bg-[#F8F7F3] p-5 shadow-[3px_3px_0_0_#000]">
                <h3 className="font-black uppercase">{item.title}</h3>
                <p className="mt-2 text-sm font-bold leading-relaxed text-zinc-700">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-4 border-black bg-[#FFF7AA] p-6 shadow-[6px_6px_0_0_#000] sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Trash2 className="text-red-600" />
            <h2 className="text-2xl font-black uppercase">Deletion requests are pending work</h2>
          </div>
          <div className="space-y-4 text-sm font-bold leading-relaxed text-zinc-800">
            <p>
              The Settings area contains the real account-deletion request control. A submitted request means the request
              is pending; it is not a promise that every application, identity-provider, billing, backup, and log record was
              immediately purged.
            </p>
            <p>
              Completion must be handled by the backend workflow and confirmed separately. Until that end-to-end workflow
              is deployed and verified, SEO la Quest must not describe deletion as instant or automatic.
            </p>
            <Link
              href="/app/settings"
              className="inline-flex items-center gap-2 border-3 border-black bg-[#FF5722] px-5 py-3 text-xs font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-orange-600"
            >
              <UserRound size={16} /> Open account settings <ExternalLink size={14} />
            </Link>
          </div>
        </section>

        <section className="border-4 border-black bg-black p-6 text-white shadow-[6px_6px_0_0_#06B6D4] sm:p-8">
          <h2 className="text-xl font-black uppercase text-[#FFE600]">Current privacy safeguards</h2>
          <ul className="mt-4 grid gap-3 text-sm font-bold text-zinc-200 md:grid-cols-2">
            <li className="border-2 border-zinc-700 p-4">Server operations re-check the authenticated account and tenant ownership.</li>
            <li className="border-2 border-zinc-700 p-4">API responses use bounded data-transfer objects instead of complete database rows.</li>
            <li className="border-2 border-zinc-700 p-4">The core logger redacts common identity, credential, and free-text fields.</li>
            <li className="border-2 border-zinc-700 p-4">Payment-card details are not stored in the SEO la Quest application database.</li>
          </ul>
        </section>

        <nav className="flex flex-wrap gap-3 border-t-4 border-black pt-6 text-xs font-black uppercase">
          <Link href="/" className="border-2 border-black bg-white px-4 py-2 shadow-[2px_2px_0_0_#000]">Home</Link>
          <Link href="/terms" className="border-2 border-black bg-white px-4 py-2 shadow-[2px_2px_0_0_#000]">Terms</Link>
          <Link href="/specs" className="border-2 border-black bg-white px-4 py-2 shadow-[2px_2px_0_0_#000]">System status</Link>
        </nav>
      </div>
    </main>
  )
}
