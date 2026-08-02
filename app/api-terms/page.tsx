import Link from 'next/link'
import { Ban, CheckCircle2, KeyRound, Lock, RadioTower } from 'lucide-react'

export const metadata = {
  title: 'API Availability | CoQuest',
  description: 'The current, fail-closed status of CoQuest API access and automation.',
}

export default function ApiTermsPage() {
  return (
    <main className="min-h-screen bg-[#F4F0EA] px-4 py-10 text-black sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="border-4 border-black bg-white p-7 shadow-[8px_8px_0_0_#000] sm:p-10">
          <span className="inline-flex items-center gap-2 border-2 border-black bg-[#A855F7] px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000]">
            <Lock size={15} /> Fail-closed developer status
          </span>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">Public API access is unavailable</h1>
          <p className="mt-4 max-w-3xl text-sm font-bold leading-relaxed text-zinc-700 sm:text-base">
            CoQuest does not currently issue working bearer keys or offer a supported third-party REST API. There are no
            published request quotas, API tiers, webhook-delivery SLAs, or enterprise capacity guarantees.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="border-4 border-black bg-[#FFB4A2] p-6 shadow-[6px_6px_0_0_#000]">
            <Ban size={30} />
            <h2 className="mt-3 text-xl font-black uppercase">Not available</h2>
            <ul className="mt-4 space-y-2 text-sm font-bold">
              <li>Bearer-key creation, rotation, or revocation</li>
              <li>External scout-trigger endpoints</li>
              <li>Developer quotas or paid API packages</li>
              <li>Guaranteed webhook delivery or response time</li>
            </ul>
          </article>
          <article className="border-4 border-black bg-[#A3E635] p-6 shadow-[6px_6px_0_0_#000]">
            <CheckCircle2 size={30} />
            <h2 className="mt-3 text-xl font-black uppercase">Current product behavior</h2>
            <ul className="mt-4 space-y-2 text-sm font-bold">
              <li>Interactive routes use Clerk-authenticated product sessions.</li>
              <li>Stripe and cron routes authenticate their own machine requests.</li>
              <li>Configured CRM URLs receive outbound exports from the product.</li>
              <li>Scan credits are enforced by server-owned entitlement state.</li>
            </ul>
          </article>
        </section>

        <section className="border-4 border-black bg-black p-6 text-white shadow-[6px_6px_0_0_#FFE600] sm:p-8">
          <div className="flex items-center gap-3"><KeyRound className="text-[#FFE600]" /><h2 className="text-xl font-black uppercase">What `/keys` means today</h2></div>
          <p className="mt-4 max-w-3xl text-sm font-bold leading-relaxed text-zinc-200">
            The key page is an unavailable-state screen. Any legacy values held in browser storage were demonstration data,
            are not server credentials, and are not accepted for authentication.
          </p>
          <Link href="/app/keys" className="mt-5 inline-flex items-center gap-2 border-3 border-white bg-[#FFE600] px-5 py-3 text-xs font-black uppercase text-black shadow-[4px_4px_0_0_#A855F7]">
            <KeyRound size={16} /> View key status
          </Link>
        </section>

        <section className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000] sm:p-8">
          <div className="flex items-center gap-3"><RadioTower className="text-[#06B6D4]" /><h2 className="text-xl font-black uppercase">Launch requirements</h2></div>
          <p className="mt-3 text-sm font-bold text-zinc-700">
            A public API requires a real credential store, scoped authorization, revocation, abuse controls, audit records,
            documented schemas, versioning, monitoring, and adversarial tests. Pricing and SLAs can be published only after
            those controls are deployed and measured.
          </p>
        </section>

        <nav className="flex flex-wrap gap-3 border-t-4 border-black pt-6 text-xs font-black uppercase">
          <Link href="/" className="border-2 border-black bg-white px-4 py-2 shadow-[2px_2px_0_0_#000]">Home</Link>
          <Link href="/specs" className="border-2 border-black bg-white px-4 py-2 shadow-[2px_2px_0_0_#000]">Architecture status</Link>
          <Link href="/app/billing" className="border-2 border-black bg-white px-4 py-2 shadow-[2px_2px_0_0_#000]">Billing</Link>
        </nav>
      </div>
    </main>
  )
}
