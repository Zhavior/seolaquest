import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HandbookPage } from '@/features/handbook/components/primitives'
import { GeoSampleScan } from '@/features/handbook/geo/GeoSampleScan'
import { JsonLdScript, breadcrumbSchema } from '@/features/handbook/seo/jsonLd'

const TITLE = 'Sample GEO Scan | SEOlaQuest'
const DESCRIPTION =
  'What a SEOlaQuest scan shows, on an invented example: the question, the AI answer and its citations, every source found, whether your site made it in, and what each source type suggests you do.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/radar' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/radar' },
}

/** Static content and no per-visitor state, so it is cached rather than rendered per request. */
export const revalidate = 3600

export default function SampleScanPage() {
  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: 'SEOlaQuest', path: '/' },
          { name: 'Sample scan', path: '/radar' },
        ])}
      />
      <HandbookPage volume="try" title="Try it" note="No account. No engine was asked. Every site here is invented.">
        <div className="hb-stack" style={{ '--gap': '2rem' } as React.CSSProperties}>
          <p className="hb-lede">
            This is what one scan shows, on an invented question about CRMs. A real scan asks Perplexity your question
            and checks your site.
          </p>
          <GeoSampleScan />
          <div className="hb-row">
            <Link href="/sign-up" className="hb-btn">
              Join early access <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="hb-btn hb-btn--label">
              What early access includes
            </Link>
          </div>
        </div>
      </HandbookPage>
    </>
  )
}
