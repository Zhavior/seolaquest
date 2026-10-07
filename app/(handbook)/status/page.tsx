import Link from 'next/link'
import { HandbookPage } from '@/features/handbook/components/primitives'

export const metadata = {
  title: 'System Architecture Status | SEOlaQuest',
  description: 'Verified implementation status and unresolved production gates for SEOlaQuest.',
  // /status is the live URL for this content: middleware 308-redirects /specs to
  // /status, so /specs never renders. The canonical names the URL that answers 200.
  alternates: { canonical: '/status' },
}

const implemented = [
  'Next.js App Router with TypeScript and server-side authorization boundaries',
  'PostgreSQL access through Prisma with tenant-scoped application queries',
  'Clerk session authentication for interactive product routes',
  'Stripe Checkout and signed webhook processing behind disabled-by-default launch switches',
  'Webhook inbox, idempotent credit ledger, entitlement checks, and SSRF-resistant CRM delivery',
  'GEO citation scan against Perplexity: source sorting, brand check and per-scan cost record, covered by tests. Off unless a feature switch and an API key are both set, and capped at 20 scans per account per day',
]

const pending = [
  'A first real GEO scan, and the measured cost per scan that pricing depends on',
  'The GEO database table, written but not yet applied to production',
  'Production database backup and restore rehearsal',
  'Signed Stripe sandbox replay against the deployed preview',
  'Published uptime and latency objectives backed by monitoring data',
  'Runtime rate limiting, durable operational alerting, and dead-letter response',
  'Verified end-to-end account deletion across application, Clerk, Stripe, backups, and logs',
]

const boundaries = [
  { name: 'Identity', text: 'Clerk session plus server-side tenant checks.' },
  { name: 'State', text: 'PostgreSQL is the source of truth for product and billing state.' },
  { name: 'Providers', text: 'Optional provider failures return unavailable or empty results, not demo records.' },
]

export default function StatusPage() {
  return (
    <HandbookPage volume="errata" title="Status" note="A code-status document, not a live status page.">
      <div className="hb-stack" style={{ '--gap': '2.5rem' } as React.CSSProperties}>
        <p className="hb-lede">Architecture without theatre.</p>
        <p className="hb-prose">
          SEOlaQuest does not currently publish an uptime SLA, discovery-latency guarantee, edge-region benchmark, or
          production capacity number. This page lists what exists in the code and what still blocks a production claim.
        </p>

        <table className="hb-ledger">
          <caption>Where each claim stands.</caption>
          <thead>
            <tr>
              <th scope="col">Claim</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Local code gates</th>
              <td>
                <span className="hb-punch" data-on="" aria-hidden="true" /> Implemented
              </td>
            </tr>
            <tr>
              <th scope="row">Production proof</th>
              <td>
                <span className="hb-slip">PENDING</span>
              </td>
            </tr>
            <tr>
              <th scope="row">Public SLA</th>
              <td>
                <span className="hb-slip">NOT OFFERED</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
          <h2 className="hb-h3">Present in the codebase</h2>
          <ul className="hb-checks">
            {implemented.map((item) => (
              <li key={item}>
                <span className="hb-punch" data-on="" aria-hidden="true" />
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
          <h2 className="hb-h3">Blocks production claims</h2>
          <ul className="hb-errata">
            {pending.map((item) => (
              <li key={item}>
                <span className="hb-slip">OPEN</span>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="hb-stack" style={{ '--gap': '1rem' } as React.CSSProperties}>
          <h2 className="hb-h3">Current trust boundaries</h2>
          <dl className="hb-faq">
            {boundaries.map((item) => (
              <div key={item.name}>
                <dt className="hb-h3">{item.name}</dt>
                <dd className="hb-prose">{item.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="hb-row">
          <Link href="/privacy" className="hb-link">
            Privacy
          </Link>
          <Link href="/api-terms" className="hb-link">
            API availability
          </Link>
          <Link href="/#errata" className="hb-link">
            Known issues in this edition
          </Link>
        </p>
      </div>
    </HandbookPage>
  )
}
