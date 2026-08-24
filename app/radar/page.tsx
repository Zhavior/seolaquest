import { getBillingPlanCatalog } from '@/features/billing/catalog'
import { RadarConsole } from '@/features/radar/components/RadarConsole'

export const metadata = {
  title: 'Radar simulator | SEOlaQuest',
  description:
    'Try the SEOlaQuest workflow against a fixed sample set: pick a tool, pick a complaint, and see the draft it produces. No account required, no live sources connected.',
  alternates: { canonical: '/radar' },
  openGraph: {
    title: 'Radar simulator | SEOlaQuest',
    description:
      'Try the SEOlaQuest workflow against a fixed sample set. No account required, no live sources connected.',
    url: '/radar',
  },
}

/**
 * Marketing content with one live input (the billing catalog) and no
 * per-visitor state, so it is cached rather than rendered per request.
 */
export const revalidate = 3600

export default function RadarSimulatorPage() {
  // The shared `Footer` owns its own copyright line now, so the page no longer
  // has to pass a server-rendered year down to keep the two in step.
  return <RadarConsole plans={getBillingPlanCatalog()} />
}
