import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HandbookPage } from '@/features/handbook/components/primitives'
import { levelTable } from '@/features/handbook/rules'
import { SAMPLE_SETS } from '@/features/handbook/sample/data'
import { SampleHunt } from '@/features/handbook/sample/SampleHunt'
import { JsonLdScript, breadcrumbSchema } from '@/features/handbook/seo/jsonLd'

const TITLE = 'Try the Sample Hunt | SEOlaQuest'
const DESCRIPTION =
  'Run the SEOlaQuest loop on invented X posts: scan, read the source, claim a lead, and watch the real XP rules pay or refuse to pay. No account, no live sources.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/radar' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/radar' },
}

/** Static content and no per-visitor state, so it is cached rather than rendered per request. */
export const revalidate = 3600

const LEVELS = levelTable(10).map((row) => row.cumulativeXp)

export default function SampleHuntPage() {
  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: 'SEOlaQuest', path: '/' },
          { name: 'Sample hunt', path: '/radar' },
        ])}
      />
      <HandbookPage volume="try" title="Try it" note="No account. No X connection. Nothing is sent anywhere.">
        <div className="hb-stack" style={{ '--gap': '2rem' } as React.CSSProperties}>
          <p className="hb-lede">Run the loop on invented posts. Watch the real XP rules pay, and refuse to pay.</p>
          <SampleHunt sets={SAMPLE_SETS} levelCumulative={LEVELS} variant="full" />
          <div className="hb-row">
            <Link href="/sign-up" className="hb-btn">
              Start free <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="hb-btn hb-btn--label">
              See what real scans cost
            </Link>
          </div>
        </div>
      </HandbookPage>
    </>
  )
}
