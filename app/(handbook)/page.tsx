import type { Metadata } from 'next'
import { loadInventory, loadNotes } from '@/features/handbook/facts'
import { Hero } from '@/features/handbook/landing/Hero'
import { HomeStage } from '@/features/handbook/landing/HomeStage'
import { SAMPLE_GEO_MARKS, SAMPLE_GEO_PINS } from '@/features/handbook/geo/sample'
import { RouteStage } from '@/features/handbook/landing/RouteStage'
import { AccessChapter } from '@/features/handbook/landing/AccessChapter'
import { NotesChapter } from '@/features/handbook/landing/NotesChapter'
import { ErrataChapter } from '@/features/handbook/landing/ErrataChapter'
import { RegisterChapter } from '@/features/handbook/landing/RegisterChapter'
import { HomeStructuredData } from '@/features/handbook/seo/HomeStructuredData'

// Title, description, and Open Graph defaults come from the root layout; only
// the URL-bearing fields are declared here, because a canonical set in the
// layout would be inherited by every other page.
export const metadata: Metadata = {
  title: 'SEOlaQuest | See Who AI Answers Cite',
  description:
    'Ask the question your buyers ask an AI search engine. SEOlaQuest lists every source the answer cited, sorts them into forums, review sites, articles and vendor pages, and shows whether your site made it in. Early access.',
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

// Marketing content with no per-visitor input, so it is cached rather than
// rendered per request. This must live on the page itself: a re-export
// forwards the component and silently drops route config.
export const revalidate = 3600

export default function HomePage() {
  const notes = loadNotes(3)
  const inventory = loadInventory()

  return (
    <>
      <HomeStructuredData />
      <HomeStage scores={[]} marks={SAMPLE_GEO_MARKS} scan={SAMPLE_GEO_PINS}>
        <Hero />
        <RouteStage />
        <AccessChapter />
        <NotesChapter notes={notes} />
        <ErrataChapter checkoutOpen={inventory.checkoutOpen} />
        <RegisterChapter />
      </HomeStage>
    </>
  )
}
