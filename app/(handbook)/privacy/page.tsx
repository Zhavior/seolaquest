import Link from 'next/link'
import { HandbookPage } from '@/features/handbook/components/primitives'

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
    body: 'For the X lead finder: tracked keywords, discovered public posts, lead workflow state, CRM configuration, and measured product activity are stored in PostgreSQL.',
  },
  {
    title: 'GEO scans',
    body: 'When GEO scans are switched on, each scan stores the question you asked, the site you checked, the answer text, the sources returned, and the tokens and cost the engine reported. The question is sent to Perplexity to run the scan.',
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

const safeguards = [
  'Server operations re-check the authenticated account and tenant ownership.',
  'API responses use bounded data-transfer objects instead of complete database rows.',
  'The core logger redacts common identity, credential, and free-text fields.',
  'Payment-card details are not stored in the SEOlaQuest application database.',
]

export default function PrivacyPage() {
  return (
    <HandbookPage
      volume="errata"
      title="Privacy"
      note="Truth-first privacy notice. Reviewed July 29, 2026."
    >
      <div className="hb-stack" style={{ '--gap': '2.25rem' } as React.CSSProperties}>
        <p className="hb-lede">What SEOlaQuest stores today.</p>
        <p className="hb-prose">
          This page describes the current application behavior. It does not claim certifications, storage regions,
          retention periods, or deletion guarantees that have not been verified for the deployed environment.
        </p>

        <section className="hb-legal">
          <h2 className="hb-h2">Data categories</h2>
          <dl className="hb-defs">
            {storedData.map((item) => (
              <div key={item.title}>
                <dt>{item.title}</dt>
                <dd>{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="hb-legal">
          <h2 className="hb-h2">Deletion requests are pending work</h2>
          <p>
            <span className="hb-slip">PENDING</span>
          </p>
          <p className="hb-prose">
            The Settings area contains the real account-deletion request control. A submitted request means the request is
            pending; it is not a promise that every application, identity-provider, billing, backup, and log record was
            immediately purged.
          </p>
          <p className="hb-prose">
            Completion must be handled by the backend workflow and confirmed separately. Until that end-to-end workflow is
            deployed and verified, SEOlaQuest must not describe deletion as instant or automatic.
          </p>
          <p>
            <Link href="/app/settings" className="hb-btn hb-btn--small">
              Open account settings
            </Link>
          </p>
        </section>

        <section className="hb-legal">
          <h2 className="hb-h2">Current privacy safeguards</h2>
          <ul className="hb-checks">
            {safeguards.map((line) => (
              <li key={line}>
                <span className="hb-punch" data-on="" aria-hidden="true" />
                <p>{line}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="hb-row">
          <Link href="/terms" className="hb-link">
            Terms
          </Link>
          <Link href="/status" className="hb-link">
            System status
          </Link>
          <a href="mailto:support@seolaquest.com" className="hb-link">
            support@seolaquest.com
          </a>
        </p>
      </div>
    </HandbookPage>
  )
}
