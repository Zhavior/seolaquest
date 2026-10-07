import Link from 'next/link'
import { HandbookFrame } from '@/features/handbook/components/HandbookFrame'
import { HandbookPage } from '@/features/handbook/components/primitives'

export const metadata = {
  title: 'Page Not Found | SEOlaQuest',
  description: 'The requested page does not exist.',
}

// Without this route, every 404 on the public site falls back to the built-in
// Next.js page, which renders no `main` landmark and no way back into the site.
// The accessibility gate treats a missing main landmark as a hard failure; the
// handbook frame supplies that landmark.
export default function NotFound() {
  return (
    <HandbookFrame>
      <HandbookPage volume="errata" title="404" note="SEOlaQuest could not find this page.">
        <div className="hb-stack" style={{ '--gap': '1.6rem' } as React.CSSProperties}>
          <p>
            <span className="hb-slip">PAGE NOT IN THIS EDITION</span>
          </p>
          <p className="hb-lede">Nothing here.</p>
          <p className="hb-prose">
            The address may be mistyped, or the page may have been retired. The links below still work.
          </p>
          <nav aria-label="Recovery links" className="hb-row">
            <Link href="/" className="hb-btn">
              Home
            </Link>
            <Link href="/radar" className="hb-btn hb-btn--label">
              Try the sample hunt
            </Link>
            <Link href="/pricing" className="hb-btn hb-btn--label">
              Pricing
            </Link>
            <Link href="/blog" className="hb-btn hb-btn--label">
              Field notes
            </Link>
          </nav>
        </div>
      </HandbookPage>
    </HandbookFrame>
  )
}
