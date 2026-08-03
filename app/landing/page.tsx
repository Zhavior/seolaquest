import React from 'react'
import dynamic from 'next/dynamic'

export const revalidate = 3600 // 1 hour caching for non-personalized page
import { Footer } from '@/components/Footer'

import { LandingNav } from '@/features/landing/components/LandingNav'
import { LandingHero } from '@/features/landing/components/LandingHero'
import { LandingFeatures } from '@/features/landing/components/LandingFeatures'
import { DeferredAnimatedBackground } from '@/features/landing/components/DeferredAnimatedBackground'

const ManaEngineDemo = dynamic(() => import('@/features/landing/components/ManaEngineDemo'), {
  loading: () => <div className="h-96 w-full bg-black/5 animate-pulse" />
})

const GuildLeaderboardWins = dynamic(() => import('@/features/landing/components/GuildLeaderboardWins'), {
  loading: () => <div className="h-64 w-full bg-black/5 animate-pulse" />
})

const PAPER_TEXTURE_DATA_URI = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E`

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4ebd8] text-black font-sans relative overflow-x-hidden selection:bg-[#ff4500] selection:text-white">
      <div
        className="absolute inset-0 z-0 opacity-[0.5] mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: `url("${PAPER_TEXTURE_DATA_URI}")` }}
      />

      <DeferredAnimatedBackground />
      <LandingNav />

      <main>
        <LandingHero />
        <ManaEngineDemo />
        <LandingFeatures />
        <GuildLeaderboardWins />
      </main>

      <Footer />
    </div>
  )
}
