import React from 'react'
import dynamic from 'next/dynamic'
import { Footer } from '@/components/Footer'

import { LandingNav } from '@/features/landing/components/LandingNav'
import { LandingHero } from '@/features/landing/components/LandingHero'
import { LandingFeatures } from '@/features/landing/components/LandingFeatures'

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

const GRAIN_TEXTURE_DATA_URI = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E`

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas font-sans text-ink selection:bg-[#ff4500] selection:text-white">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.055) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.055) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          backgroundPosition: 'top left',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(0,0,0,0.32) 1px, transparent 0)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.045] mix-blend-multiply"
        style={{ backgroundImage: `url("${GRAIN_TEXTURE_DATA_URI}")` }}
      />

      <LandingNav />

      <main className="relative z-10">
        <LandingHero />
        <ManaEngineDemo />
        <LandingFeatures />
        <GuildLeaderboardWins />
      </main>

      <Footer />
    </div>
  )
}
