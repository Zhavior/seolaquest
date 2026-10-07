import type { Metadata } from 'next'
import { BILLING_EVENTS, recordBillingEvent } from '@/features/billing/analytics'
import { isPotionCheckoutOpen } from '@/features/billing/checkoutGate'
import { HandbookPage } from '@/features/handbook/components/primitives'
import { loadFounderSeats, loadInventory } from '@/features/handbook/facts'
import { CheckoutNote } from '@/features/handbook/landing/InventoryChapter'
import { PlanLedger } from '@/features/handbook/landing/PlanLedger'
import { SeatCard } from '@/features/handbook/landing/SeatCard'
import { JsonLdScript, breadcrumbSchema } from '@/features/handbook/seo/jsonLd'

export const metadata: Metadata = {
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

export default async function PricingPage() {
  recordBillingEvent({ name: BILLING_EVENTS.pricingViewed, surface: 'pricing' })
  const inventory = loadInventory()
  const seats = await loadFounderSeats()
  const potionsOpen = isPotionCheckoutOpen()

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: 'SEOlaQuest', path: '/' },
          { name: 'Pricing', path: '/pricing' },
        ])}
      />
      <HandbookPage
        volume="inventory"
        title="Inventory"
        note="Prices in USD, straight from the billing catalog."
      >
        <div className="hb-stack" style={{ '--gap': '2.25rem' } as React.CSSProperties}>
          <p className="hb-lede">Know what you can do before you pay.</p>
          <p className="hb-prose">
            SEOlaQuest stores keywords for free. Manual provider-backed scans require verified paid access and available
            scan credits. A source match is not a qualified customer.
          </p>

          <PlanLedger inventory={inventory} actions soldOut={Boolean(seats?.soldOut)} />
          <CheckoutNote open={inventory.checkoutOpen} />

          <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
            <h2 className="hb-h3">Founder Pass: price locked while you stay subscribed</h2>
            <SeatCard seats={seats} checkoutOpen={inventory.checkoutOpen} />
            <ul className="hb-checks">
              {inventory.founderLockTerms.map((term) => (
                <li key={term}>
                  <span className="hb-punch" aria-hidden="true" />
                  <p>{term}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
            <h2 className="hb-h3">How paid access works</h2>
            <ul className="hb-checks">
              {[
                'Manual scans use the server credit ledger. One scan costs 1 mana.',
                'Saved results retain their original source links.',
                'Paid access starts only after signed webhook verification.',
                'Returning from Stripe is pending, not success, until the signed webhook updates your account.',
                'Checkout stays paused unless payment configuration and a recent durable-worker heartbeat are both verified.',
              ].map((line) => (
                <li key={line}>
                  <span className="hb-punch" data-on="" aria-hidden="true" />
                  <p>{line}</p>
                </li>
              ))}
            </ul>
          </div>

          {potionsOpen ? (
            <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
              <h2 className="hb-h3">Mana top-ups</h2>
              <table className="hb-ledger">
                <caption>One-time packs, added to your scan credits.</caption>
                <thead>
                  <tr>
                    <th scope="col">Pack</th>
                    <th scope="col">Price</th>
                    <th scope="col">Mana</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.potions.map((potion) => (
                    <tr key={potion.id}>
                      <th scope="row">{potion.name}</th>
                      <td className="hb-mono">{potion.priceLabel}</td>
                      <td className="hb-mono">{potion.mana.toLocaleString('en-US')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="hb-mono hb-soft">Mana top-up packs are not for sale yet.</p>
          )}

          <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
            <h2 className="hb-h3">Currency, tax, and renewal</h2>
            <p className="hb-prose">
              Catalog prices are shown in USD. Stripe shows the final USD total and any tax charged before
              confirmation. Beta Hunter and Founder Pass renew monthly until cancellation is confirmed by Stripe and the server billing state.
            </p>
          </div>

          <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
            <h2 className="hb-h3">Support, receipts, and refunds</h2>
            <p className="hb-prose">
              Available invoices and receipts are accessed through Stripe billing management after account setup.
              Consumed credits are not automatically restored. For billing disputes or refund requests, email{' '}
              <a href="mailto:support@seolaquest.com?subject=SEOlaQuest%20billing%20support">support@seolaquest.com</a>;
              applicable consumer rights are not waived.
            </p>
          </div>

          <p className="hb-mono hb-soft">
            {inventory.comingSoon.map((plan) => plan.name).join(' and ')} are not for sale and grant no entitlement.
          </p>
        </div>
      </HandbookPage>
    </>
  )
}
