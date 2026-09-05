import Link from 'next/link'
import { CheckCircle2, CircleSlash2, Crown, Search, ShieldCheck } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { BILLING_EVENTS, recordBillingEvent } from '@/features/billing/analytics'
import { getBillingPlanCatalog } from '@/features/billing/catalog'
import { FounderSeatService } from '@/src/modules/billing/application/FounderSeatService'
import { FOUNDER_LOCK_TERMS } from '@/src/modules/billing/domain/catalog'

export const metadata = {
  title: 'Pricing | SEOlaQuest',
  description: 'SEOlaQuest plan availability and manual scan entitlements.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing | SEOlaQuest',
    description: 'SEOlaQuest plan availability and manual scan entitlements.',
    url: '/pricing',
  },
}

/**
 * Cached for a minute rather than rendered per request. The founder seat count
 * is the one live number on this page, and a marketing page should not pay a
 * database round trip per visitor to keep it to-the-second accurate.
 */
export const revalidate = 60

/**
 * A marketing page must render even when the database does not answer, so a
 * failed count degrades to "no counter" rather than to an error page. The cap
 * itself is enforced at checkout, never here.
 */
async function founderSeatsOrNull() {
  try {
    return await FounderSeatService.snapshot()
  } catch {
    return null
  }
}

export default async function PricingPage() {
  recordBillingEvent({ name: BILLING_EVENTS.pricingViewed, surface: 'pricing' })
  const plans = getBillingPlanCatalog()
  const free = plans.find((plan) => plan.code === 'FREE')!
  const beta = plans.find((plan) => plan.code === 'BETA')!
  const founder = plans.find((plan) => plan.code === 'FOUNDER')!
  const founderSeats = await founderSeatsOrNull()
  const unavailablePlans = plans.filter((plan) => !plan.enabled)

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
        <Link href="/" className="text-sm font-semibold underline decoration-4 underline-offset-4">← SEOlaQuest home</Link>
        <header className="mt-8 max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-xl border border-outline bg-accent px-4 py-2 text-xs font-semibold"><ShieldCheck size={16} /> Straightforward beta pricing</span>
          <h1 className="font-display mt-6 text-5xl font-medium leading-none sm:text-7xl">Know what you can do before you pay.</h1>
          <p className="mt-5 max-w-3xl text-lg font-medium text-ink-muted">SEOlaQuest stores keywords for free. Manual provider-backed scans require verified paid access and available scan credits. A source match is not a qualified customer.</p>
        </header>

        <section className="mt-12 grid gap-7 md:grid-cols-2">
          <article className="rounded-[20px] border border-outline bg-card p-7">
            <CircleSlash2 className="h-9 w-9" />
            <h2 className="font-display mt-4 text-3xl font-medium">{free.name}</h2>
            <p className="mt-2 text-4xl font-semibold">{free.priceLabel}</p>
            <ul className="mt-5 space-y-3 font-medium text-ink-muted">
              {free.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><CheckCircle2 className="shrink-0" /> {benefit}</li>)}
            </ul>
            <Link href="/sign-up" className="mt-7 inline-flex rounded-xl border border-outline bg-card px-5 py-3 font-semibold">Create free account</Link>
          </article>

          <article className="rounded-[20px] border border-outline bg-highlight p-7">
            <Search className="h-9 w-9" />
            <h2 className="font-display mt-4 text-3xl font-medium">{beta.name}</h2>
            <p className="mt-2 text-4xl font-semibold">{beta.priceLabel}</p>
            <ul className="mt-5 space-y-3 font-medium">
              {beta.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><CheckCircle2 className="shrink-0" /> {benefit}</li>)}
            </ul>
            <Link href="/sign-up" className="mt-7 inline-flex rounded-xl border border-outline bg-accent-2 px-5 py-3 font-semibold text-on-accent">Create account to continue</Link>
          </article>
        </section>

        <section className="mt-7 rounded-[20px] border border-outline bg-highlight-strong p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-xl border border-outline bg-forest px-3 py-1.5 text-[11px] font-semibold tracking-wide text-accent">
                <Crown size={14} /> Founder — price locked for life
              </span>
              <h2 className="font-display mt-4 text-3xl font-medium">{founder.name}</h2>
              <p className="mt-2 text-4xl font-semibold">{founder.priceLabel}</p>
            </div>

            {founderSeats ? (
              <div className="min-w-[220px] rounded-xl border border-outline bg-card p-4">
                <p className="text-xs font-semibold">
                  {founderSeats.soldOut
                    ? `All ${founderSeats.limit} founder seats claimed`
                    : `${founderSeats.remaining} / ${founderSeats.limit} founder seats remaining`}
                </p>
                <div className="mt-2 h-3 w-full rounded-xl border border-outline bg-canvas">
                  <div
                    className="h-full bg-accent-2"
                    style={{
                      width: `${Math.min(100, Math.round(((founderSeats.limit - founderSeats.remaining) / founderSeats.limit) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <ul className="mt-5 space-y-3 font-medium">
            {founder.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-2"><CheckCircle2 className="shrink-0" /> {benefit}</li>
            ))}
          </ul>

          <ul className="mt-5 space-y-2 rounded-xl border border-outline bg-card p-4 text-sm font-medium">
            {FOUNDER_LOCK_TERMS.map((term) => <li key={term}>{term}</li>)}
          </ul>

          {founderSeats?.soldOut ? (
            <p className="mt-7 inline-flex rounded-xl border border-outline bg-inset px-5 py-3 font-semibold text-ink-muted">
              Founder seats sold out
            </p>
          ) : (
            <Link href="/sign-up" className="mt-7 inline-flex rounded-xl border border-outline bg-accent-2 px-5 py-3 font-semibold text-on-accent">
              Claim a founder seat
            </Link>
          )}
        </section>

        <aside className="mt-10 rounded-xl border border-outline bg-forest p-6 font-medium text-on-forest">
          Checkout stays paused unless payment configuration and a recent durable-worker heartbeat are both verified. Returning from Stripe is pending—not success—until the signed webhook updates the account.
        </aside>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-[20px] border border-outline bg-card p-6">
            <h2 className="font-display text-2xl font-medium">Currency, tax, and renewal</h2>
            <p className="mt-3 font-medium text-ink-muted">Catalog prices are shown in USD. Stripe shows the final USD total and any tax charged before confirmation. Beta renews monthly until cancellation is confirmed by Stripe and the server billing state.</p>
          </article>
          <article className="rounded-[20px] border border-outline bg-card p-6">
            <h2 className="font-display text-2xl font-medium">Support, receipts, and refunds</h2>
            <p className="mt-3 font-medium text-ink-muted">Available invoices and receipts are accessed through Stripe billing management after account setup. Consumed credits are not automatically restored. For billing disputes or refund requests, email <a className="underline decoration-2 underline-offset-2" href="mailto:support@seolaquest.com?subject=SEO%20la%20Quest%20billing%20support">support@seolaquest.com</a>; applicable consumer rights are not waived.</p>
          </article>
        </section>

        <p className="mt-8 text-sm font-semibold text-ink-muted">
          {unavailablePlans.map((plan) => plan.name).join(' and ')} are not for sale and grant no entitlement.
        </p>
      </main>
      <Footer />
    </div>
  )
}
