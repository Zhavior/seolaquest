import Link from 'next/link'
import { HandbookPage } from '@/features/handbook/components/primitives'
// The catalog is the single source of truth for what is on sale. Restating the
// seat count, the credit allowance, or the lock wording by hand here is how terms
// drift out of step with what checkout actually enforces.
import { FOUNDER_LOCK_TERMS, FOUNDER_SEAT_LIMIT, PLAN_CATALOG } from '@/src/modules/billing/domain/catalog'

const SECTIONS = [
  { id: 'code-of-conduct', label: '1. Guild code' },
  { id: 'billing-terms', label: '2. Billing' },
  { id: 'mana-policy', label: '3. Mana and cancelling' },
  { id: 'acceptable-use', label: '4. Acceptable use' },
]

const PROHIBITED = [
  {
    name: 'Unfair automated scraping',
    text: "Using automated tools to scrape, dump, or extract SEOlaQuest's proprietary lead database or attempt bulk reverse-engineering of Scout signals.",
  },
  {
    name: 'Unsolicited spam outreach',
    text: 'Weaponizing SEOlaQuest leads for mass automated email spam, bot spamming on social channels, or sending deceptive/phishing materials.',
  },
  {
    name: 'Key reselling and re-licensing',
    text: 'Sub-licensing, renting, or selling access to SEOlaQuest accounts or internal credentials to third parties without prior written consent.',
  },
  {
    name: 'Infrastructure denial',
    text: 'Executing Denial of Service (DoS) attacks or flooding application or webhook endpoints to exhaust shared infrastructure.',
  },
]

export default function TermsPage() {
  const beta = PLAN_CATALOG.BETA
  const founder = PLAN_CATALOG.FOUNDER
  return (
    <HandbookPage
      volume="errata"
      title="Terms"
      note={
        <nav aria-label="Sections">
          <ul className="hb-toc">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      }
    >
      <div className="hb-stack" style={{ '--gap': '2rem' } as React.CSSProperties}>
        <p className="hb-lede">Master Guild Code and Terms of Service.</p>
        <p className="hb-prose">
          Welcome to SEOlaQuest. By using the application, configured scans, or paid credits, you agree to this Master
          Guild Code of Conduct and Operating Terms.
        </p>
        <p className="hb-mono hb-soft">Effective revision: July 2026, v2.4.</p>

        <section id="code-of-conduct" className="hb-legal">
          <h2 className="hb-h2">1. Master Guild Code of Conduct</h2>
          <p className="hb-soft">Honor, speed, and ethical lead hunting.</p>
          <p className="hb-prose">
            SEOlaQuest may surface stored provider results when a configured scan succeeds. Matches are not verified
            purchase intent. All users must operate under the following core principles:
          </p>
          <dl className="hb-defs">
            <div>
              <dt>Fair play and rate integrity</dt>
              <dd>
                Hunters shall not attempt to breach or alter API rate limits using distributed proxy networks, key
                pooling, or concurrent request spikes designed to degrade service performance.
              </dd>
            </div>
            <div>
              <dt>Honorable outreach</dt>
              <dd>
                Stored source matches must be used solely for relevant, non-deceptive B2B communication. Impersonation of
                third-party organizations or deceptive automation may result in account restriction under these terms.
              </dd>
            </div>
            <div>
              <dt>Security vigilance</dt>
              <dd>
                Public API credentials are not currently offered. Do not attempt to access internal endpoints or
                credentials, and report suspected compromise through an available support channel.
              </dd>
            </div>
          </dl>
        </section>

        <section id="billing-terms" className="hb-legal">
          <h2 className="hb-h2">2. Subscription Billing and Tier Terms</h2>
          <p className="hb-soft">Free access and the enabled paid plans.</p>
          <p className="hb-prose">
            The enabled SEOlaQuest paid subscriptions are billed monthly through Stripe. A qualifying positive paid invoice
            adds scan credits: {beta.scanLimit.toLocaleString('en-US')} for Beta Hunter and{' '}
            {founder.scanLimit.toLocaleString('en-US')} for Founder Pass. Free access includes no paid scan, AI-reply, or
            CRM-export entitlement.
          </p>

          <table className="hb-ledger">
            <caption>Current sellable catalog. Server-enforced.</caption>
            <thead>
              <tr>
                <th scope="col">Plan</th>
                <th scope="col">Price</th>
                <th scope="col">Includes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{PLAN_CATALOG.FREE.name}</th>
                <td>{PLAN_CATALOG.FREE.priceLabel}</td>
                <td>Dashboard access with no paid feature entitlement or included scan credits.</td>
              </tr>
              <tr>
                <th scope="row">{beta.name}</th>
                <td>{beta.priceLabel}</td>
                <td>
                  {beta.scanLimit.toLocaleString('en-US')} credits per positive paid subscription-creation or renewal
                  invoice; paid scans, AI replies, and CRM export while the subscription period is current.
                </td>
              </tr>
              <tr>
                <th scope="row">{founder.name}</th>
                <td>{founder.priceLabel}</td>
                <td>
                  Limited to {FOUNDER_SEAT_LIMIT} seats. Same paid entitlements as {beta.name} at a higher included
                  allowance ({founder.scanLimit.toLocaleString('en-US')} credits), plus the rate lock described below.
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="hb-h3">Founder rate lock</h3>
          <ul className="hb-checks">
            {FOUNDER_LOCK_TERMS.map((term) => (
              <li key={term}>
                <span className="hb-punch" data-on="" aria-hidden="true" />
                <p>{term}</p>
              </li>
            ))}
          </ul>
          <p className="hb-prose">
            Pro and Agency are preview-only and grant no entitlement. Credit top-ups are disabled until refund and dispute
            reversal handling is implemented.
          </p>

          <h3 className="hb-h3">Automatic renewal and upgrades</h3>
          <p className="hb-prose">
            Beta Hunter and Founder Pass each renew on their Stripe billing date until canceled. Mid-cycle upgrades
            between them are not currently enabled, and no plan above Founder Pass is for sale. Checkout can be disabled
            during production verification without changing an existing subscription record.
          </p>
        </section>

        <section id="mana-policy" className="hb-legal">
          <h2 className="hb-h2">3. Usage-Based Mana and Cancellation Rules</h2>
          <p className="hb-soft">Non-refundable consumption and account self-service.</p>
          <p>
            <span className="hb-slip">MANA IS NON-REFUNDABLE</span>
          </p>
          <p className="hb-prose">
            Credits are usage units recorded by the server ledger. Consumed credits are not restored automatically.
            Contact support for billing disputes; nothing in these terms limits rights that cannot legally be waived.
          </p>
          <h3 className="hb-h3">Account cancellation procedures</h3>
          <p className="hb-prose">
            Hunters may use the available subscription controls through the <Link href="/app/billing">Billing page</Link>.
            A cancellation is effective only when Stripe and the server-owned billing state confirm it:
          </p>
          <ul className="hb-checks">
            {[
              'Your subscription will not renew at the next billing interval.',
              'You retain full access to remaining active Mana and features until the end of your current paid billing period.',
              'Unused credits remain recorded on your account, but paid capabilities are unavailable without a current active subscription period.',
              'Credit top-ups are not currently sold; Pro and Agency remain unavailable.',
            ].map((line) => (
              <li key={line}>
                <span className="hb-punch" data-on="" aria-hidden="true" />
                <p>{line}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="acceptable-use" className="hb-legal">
          <h2 className="hb-h2">4. Acceptable Use Policy</h2>
          <p className="hb-soft">Strict anti-scraping, anti-spam, and API safeguards.</p>
          <p className="hb-prose">
            SEOlaQuest supports keyword-based source discovery and user-reviewed lead workflows. A source match is not
            verified purchase intent. The following actions are strictly prohibited:
          </p>
          <ol className="hb-errata">
            {PROHIBITED.map((item) => (
              <li key={item.name}>
                <span className="hb-slip">NO</span>
                <div>
                  <p>
                    <strong>{item.name}.</strong> {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="hb-row">
          <Link href="/privacy" className="hb-link">
            Privacy policy
          </Link>
          <Link href="/api-terms" className="hb-link">
            API availability
          </Link>
          <a href="mailto:support@seolaquest.com" className="hb-link">
            support@seolaquest.com
          </a>
        </p>
      </div>
    </HandbookPage>
  )
}
