import Link from 'next/link'
import { CheckCircle2, CircleSlash2, Search, ShieldCheck } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { BILLING_EVENTS, recordBillingEvent } from '@/features/billing/analytics'
import { getBillingPlanCatalog } from '@/features/billing/catalog'

export const metadata = {
  title: 'Pricing | SEO la Quest',
  description: 'SEO la Quest plan availability and manual scan entitlements.',
}

export default function PricingPage() {
  recordBillingEvent({ name: BILLING_EVENTS.pricingViewed, surface: 'pricing' })
  const plans = getBillingPlanCatalog()
  const free = plans.find((plan) => plan.code === 'FREE')!
  const beta = plans.find((plan) => plan.code === 'BETA')!
  const unavailablePlans = plans.filter((plan) => !plan.enabled)

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black">
      <main className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
        <Link href="/" className="text-sm font-black uppercase underline decoration-4 underline-offset-4">← SEO la Quest home</Link>
        <header className="mt-8 max-w-4xl">
          <span className="inline-flex items-center gap-2 border-3 border-black bg-[#FFE600] px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0_0_#000]"><ShieldCheck size={16} /> Straightforward beta pricing</span>
          <h1 className="mt-6 text-5xl font-black uppercase leading-none sm:text-7xl">Know what you can do before you pay.</h1>
          <p className="mt-5 max-w-3xl text-lg font-bold text-zinc-700">SEO la Quest stores keywords for free. Manual provider-backed scans require verified paid access and available scan credits. A source match is not a qualified customer.</p>
        </header>

        <section className="mt-12 grid gap-7 md:grid-cols-2">
          <article className="border-4 border-black bg-white p-7 shadow-[8px_8px_0_0_#000]">
            <CircleSlash2 className="h-9 w-9" />
            <h2 className="mt-4 text-3xl font-black uppercase">{free.name}</h2>
            <p className="mt-2 text-4xl font-black">{free.priceLabel}</p>
            <ul className="mt-5 space-y-3 font-bold text-zinc-700">
              {free.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><CheckCircle2 className="shrink-0" /> {benefit}</li>)}
            </ul>
            <Link href="/sign-up" className="mt-7 inline-flex border-4 border-black bg-white px-5 py-3 font-black uppercase shadow-[4px_4px_0_0_#000]">Create free account</Link>
          </article>

          <article className="border-4 border-black bg-[#FFE600] p-7 shadow-[8px_8px_0_0_#000]">
            <Search className="h-9 w-9" />
            <h2 className="mt-4 text-3xl font-black uppercase">{beta.name}</h2>
            <p className="mt-2 text-4xl font-black">{beta.priceLabel}</p>
            <ul className="mt-5 space-y-3 font-bold">
              {beta.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><CheckCircle2 className="shrink-0" /> {benefit}</li>)}
            </ul>
            <Link href="/sign-up" className="mt-7 inline-flex border-4 border-black bg-[#FF5722] px-5 py-3 font-black uppercase text-black shadow-[4px_4px_0_0_#000]">Create account to continue</Link>
          </article>
        </section>

        <aside className="mt-10 border-4 border-black bg-black p-6 font-bold text-white shadow-[6px_6px_0_0_#06B6D4]">
          Checkout stays paused unless payment configuration and a recent durable-worker heartbeat are both verified. Returning from Stripe is pending—not success—until the signed webhook updates the account.
        </aside>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
            <h2 className="text-2xl font-black uppercase">Currency, tax, and renewal</h2>
            <p className="mt-3 font-bold text-zinc-700">Catalog prices are shown in USD. Stripe shows the final USD total and any tax charged before confirmation. Beta renews monthly until cancellation is confirmed by Stripe and the server billing state.</p>
          </article>
          <article className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
            <h2 className="text-2xl font-black uppercase">Support, receipts, and refunds</h2>
            <p className="mt-3 font-bold text-zinc-700">Available invoices and receipts are accessed through Stripe billing management after account setup. Consumed credits are not automatically restored. For billing disputes or refund requests, email <a className="underline decoration-2 underline-offset-2" href="mailto:support@seolaquest.com?subject=SEO%20la%20Quest%20billing%20support">support@seolaquest.com</a>; applicable consumer rights are not waived.</p>
          </article>
        </section>

        <p className="mt-8 text-sm font-black uppercase text-zinc-600">
          {unavailablePlans.map((plan) => plan.name).join(' and ')} are not for sale and grant no entitlement.
        </p>
      </main>
      <Footer />
    </div>
  )
}
