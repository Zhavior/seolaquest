import React from 'react'
import dynamic from 'next/dynamic'
import { Footer } from '@/components/Footer'

import { LandingNav } from '@/features/landing/components/LandingNav'
import { LandingHero } from '@/features/landing/components/LandingHero'
import { LandingFeatures } from '@/features/landing/components/LandingFeatures'
import { HomepageOAuthDisclosure } from '@/features/landing/components/HomepageOAuthDisclosure'
import { LandingRadarDemo } from '@/features/landing/components/LandingRadarDemo'

// Title, description, and Open Graph defaults come from the root layout; only
// the URL-bearing fields are declared here, because a canonical set in the
// layout would be inherited by every other page.
export const metadata = {
  title: 'SEOlaQuest | Customer Research on X',
  description: 'Find customer problems and requests for alternatives in public X conversations. Review source posts and buyer signals. Try the interactive sample demo.',
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

// Non-personalized marketing content. This must live on the page itself: a
// `export { default } from ...` re-export forwards only the component, silently
// dropping route segment config like this one.
export const revalidate = 3600 // 1 hour

const ManaEngineDemo = dynamic(() => import('@/features/landing/components/ManaEngineDemo'), {
  loading: () => <div className="h-96 w-full bg-black/5 animate-pulse" />
})

const GuildLeaderboardWins = dynamic(() => import('@/features/landing/components/GuildLeaderboardWins'), {
  loading: () => <div className="h-64 w-full bg-black/5 animate-pulse" />
})

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas font-sans text-ink selection:bg-accent selection:text-on-accent">
      <LandingNav />

      <main className="relative z-10">
        <LandingHero />
        <ManaEngineDemo />
        <LandingRadarDemo />
        <LandingFeatures />
        <HomepageOAuthDisclosure />
        <GuildLeaderboardWins />
      </main>

      <Footer />
    </div>
  )
}
