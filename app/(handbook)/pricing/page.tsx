import type { Metadata } from 'next'
import Link from 'next/link'
import { BILLING_EVENTS, recordBillingEvent } from '@/features/billing/analytics'
import { HandbookPage } from '@/features/handbook/components/primitives'
import { AccessLedger } from '@/features/handbook/landing/AccessChapter'
import { JsonLdScript, breadcrumbSchema } from '@/features/handbook/seo/jsonLd'

const DESCRIPTION = 'SEOlaQuest early access is free. GEO scans are not on sale yet and have no price until real scans report what they cost.'

export const metadata: Metadata = {
  title: 'Pricing | SEOlaQuest',
  description: DESCRIPTION,
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing | SEOlaQuest',
    description: DESCRIPTION,
    url: '/pricing',
  },
}

/** Static content and no per-visitor state, so it is cached rather than rendered per request. */
export const revalidate = 3600

export default function PricingPage() {
  recordBillingEvent({ name: BILLING_EVENTS.pricingViewed, surface: 'pricing' })

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: 'SEOlaQuest', path: '/' },
          { name: 'Pricing', path: '/pricing' },
        ])}
      />
      <HandbookPage volume="inventory" title="Inventory" note="Early access. Nothing on this page is for sale.">
        <div className="hb-stack" style={{ '--gap': '2.25rem' } as React.CSSProperties}>
          <p className="hb-lede">Free to join. No price for GEO scans yet.</p>
          <p className="hb-prose">
            Every GEO scan is a paid call to an AI search engine, and SEOlaQuest records exactly what the engine charged
            for each one. No real scan has run yet, so there is no honest number to build a price on. Pricing will be
            published here once there is.
          </p>

          <AccessLedger />

          <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
            <h2 className="hb-h3">Already on an X lead finder plan?</h2>
            <p className="hb-prose">
              Your plan, credits and renewal are unchanged. Manage them from Billing inside the app. The terms describe
              those plans in full.
            </p>
            <p className="hb-row">
              <Link href="/app/billing" className="hb-link">
                Open Billing
              </Link>
              <Link href="/terms#billing-terms" className="hb-link">
                Plan terms
              </Link>
            </p>
          </div>

          <div className="hb-row">
            <Link href="/sign-up" className="hb-btn">
              Join early access
            </Link>
            <Link href="/radar" className="hb-btn hb-btn--label">
              See a sample scan
            </Link>
          </div>
        </div>
      </HandbookPage>
    </>
  )
}
