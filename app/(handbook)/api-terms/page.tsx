import Link from 'next/link'
import { HandbookPage } from '@/features/handbook/components/primitives'

export const metadata = {
  title: 'API Availability | SEOlaQuest',
  description: 'The current, fail-closed status of SEOlaQuest API access and automation.',
  alternates: { canonical: '/api-terms' },
}

const unavailable = [
  'Bearer-key creation, rotation, or revocation',
  'External scout-trigger endpoints',
  'Developer quotas or paid API packages',
  'Guaranteed webhook delivery or response time',
]

const behavior = [
  'Interactive routes use Clerk-authenticated product sessions.',
  'Stripe and cron routes authenticate their own machine requests.',
  'Configured CRM URLs receive outbound exports from the product.',
  'Scan credits are enforced by server-owned entitlement state.',
]

export default function ApiTermsPage() {
  return (
    <HandbookPage
      volume="errata"
      title={<span className="hb-plain">API</span>}
      note="Fail-closed developer status."
    >
      <div className="hb-stack" style={{ '--gap': '2.25rem' } as React.CSSProperties}>
        <p className="hb-lede">Public API access is unavailable.</p>
        <p className="hb-prose">
          SEOlaQuest does not currently issue working bearer keys or offer a supported third-party REST API. There are no
          published request quotas, API tiers, webhook-delivery SLAs, or enterprise capacity guarantees.
        </p>

        <section className="hb-legal">
          <h2 className="hb-h2">Not available</h2>
          <ul className="hb-errata">
            {unavailable.map((line) => (
              <li key={line}>
                <span className="hb-slip">NO</span>
                <p>{line}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="hb-legal">
          <h2 className="hb-h2">Current product behavior</h2>
          <ul className="hb-checks">
            {behavior.map((line) => (
              <li key={line}>
                <span className="hb-punch" data-on="" aria-hidden="true" />
                <p>{line}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="hb-legal">
          <h2 className="hb-h2">What the keys page means today</h2>
          <p className="hb-prose">
            The key page is an unavailable-state screen. Any legacy values held in browser storage were demonstration
            data, are not server credentials, and are not accepted for authentication.
          </p>
          <p>
            <Link href="/app/keys" className="hb-btn hb-btn--small">
              View key status
            </Link>
          </p>
        </section>

        <section className="hb-legal">
          <h2 className="hb-h2">Launch requirements</h2>
          <p className="hb-prose">
            A public API requires a real credential store, scoped authorization, revocation, abuse controls, audit
            records, documented schemas, versioning, monitoring, and adversarial tests. Pricing and SLAs can be published
            only after those controls are deployed and measured.
          </p>
        </section>

        <p className="hb-row">
          <Link href="/status" className="hb-link">
            Architecture status
          </Link>
          <Link href="/pricing" className="hb-link">
            Pricing
          </Link>
        </p>
      </div>
    </HandbookPage>
  )
}
