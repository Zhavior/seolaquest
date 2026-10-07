import Link from 'next/link'
import { Brand } from './Brand'

const READ = [
  { label: 'How the hunt works', href: '/#hunt' },
  { label: 'Try the sample hunt', href: '/radar' },
  { label: 'Quests and XP', href: '/#quests' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Field notes', href: '/blog' },
]

const FINE_PRINT = [
  { label: 'Errata and status', href: '/status' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'API availability', href: '/api-terms' },
]

/** What this is, where the small print lives, what it is not, and who drew the icons. */
export function HandbookFooter() {
  return (
    <footer className="hb-desk">
      <div className="hb-desk-grid">
        <div>
          <Brand />
          <p className="hb-desk-fine" style={{ marginTop: '0.9rem' }}>
            Find buyers on X. Sample data on this site is invented and labelled. X is a trademark of its owner;
            SEOlaQuest is an independent product and is not affiliated with X Corp.
          </p>
        </div>
        <nav aria-label="Read">
          <h2>Read</h2>
          <ul>
            {READ.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal and status">
          <h2>Fine print</h2>
          <ul>
            {FINE_PRINT.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <a href="mailto:support@seolaquest.com">support@seolaquest.com</a>
            </li>
          </ul>
        </nav>
      </div>
      <p className="hb-desk-fine" style={{ maxWidth: '74rem', margin: '2rem auto 0' }}>
        © 2026 SEOlaQuest. No public uptime SLA and no open API today; both are stated in the errata.
      </p>
      <p className="hb-desk-fine" style={{ maxWidth: '74rem', margin: '0.6rem auto 0' }}>
        Icon shapes from game-icons.net by Lorc, Delapouite and Skoll, licensed{' '}
        <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Recoloured with metal and gem finishes.
      </p>
    </footer>
  )
}
