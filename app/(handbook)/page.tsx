import type { Metadata } from 'next'
import { loadFounderSeats, loadInventory, loadNotes } from '@/features/handbook/facts'
import { Hero } from '@/features/handbook/landing/Hero'
import { HomeStage } from '@/features/handbook/landing/HomeStage'
import { HERO_SCORES } from '@/features/handbook/landing/heroPosts'
import { RouteStage } from '@/features/handbook/landing/RouteStage'
import { QuestsChapter } from '@/features/handbook/landing/QuestsChapter'
import { InventoryChapter } from '@/features/handbook/landing/InventoryChapter'
import { NotesChapter } from '@/features/handbook/landing/NotesChapter'
import { ErrataChapter } from '@/features/handbook/landing/ErrataChapter'
import { RegisterChapter } from '@/features/handbook/landing/RegisterChapter'
import { HomeStructuredData } from '@/features/handbook/seo/HomeStructuredData'

// Title, description, and Open Graph defaults come from the root layout; only
// the URL-bearing fields are declared here, because a canonical set in the
// layout would be inherited by every other page.
export const metadata: Metadata = {
  title: 'SEOlaQuest | Find Buyers on X',
  description:
    'Scan X for the problems you solve. Every match is scored for buyer intent and arrives with its source post. Play it as a daily quest: claim leads, earn XP, level up.',
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

// Marketing content with one live input (the founder seat count), so it is
// cached briefly rather than rendered per request. This must live on the page
// itself: a re-export forwards the component and silently drops route config.
export const revalidate = 60

export default async function HomePage() {
  const [seats, inventory, notes] = await Promise.all([
    loadFounderSeats(),
    Promise.resolve(loadInventory()),
    Promise.resolve(loadNotes(3)),
  ])

  return (
    <>
      <HomeStructuredData inventory={inventory} />
      <HomeStage scores={HERO_SCORES}>
        <Hero />
        <RouteStage />
        <QuestsChapter />
        <InventoryChapter inventory={inventory} seats={seats} />
        <NotesChapter notes={notes} />
        <ErrataChapter checkoutOpen={inventory.checkoutOpen} />
        <RegisterChapter />
      </HomeStage>
    </>
  )
}
