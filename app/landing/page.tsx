'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Sword, Wand, Axe, Shield, Flame } from 'lucide-react'
import { Footer } from '@/components/Footer'

import { LandingNav } from '@/features/landing/components/LandingNav'
import { LandingHero } from '@/features/landing/components/LandingHero'
import { LandingFeatures } from '@/features/landing/components/LandingFeatures'

const ManaEngineDemo = dynamic(() => import('@/features/landing/components/ManaEngineDemo'), {
  loading: () => <div className="h-96 w-full bg-black/5 animate-pulse" />
})

const GuildLeaderboardWins = dynamic(() => import('@/features/landing/components/GuildLeaderboardWins'), {
  loading: () => <div className="h-64 w-full bg-black/5 animate-pulse" />
})

const PAPER_TEXTURE_DATA_URI = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E`

interface AnimatedWeaponProps {
  Icon: React.ElementType
  delay: number
  className?: string
}

const AnimatedWeapon = ({ Icon, delay, className = "" }: AnimatedWeaponProps) => (
  <motion.div
    animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }}
    transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
    className={`absolute text-black ${className}`}
  >
    <Icon size={120} strokeWidth={1.5} className="opacity-10" />
  </motion.div>
)

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-[#f4ebd8] text-black font-sans relative overflow-x-hidden selection:bg-[#ff4500] selection:text-white">
      
      {/* Optimized SVG noise overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.5] mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url("${PAPER_TEXTURE_DATA_URI}")` }} />

      {/* Background Weapons */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
        <AnimatedWeapon Icon={Sword} delay={0} className="top-20 left-10" />
        <AnimatedWeapon Icon={Wand} delay={1} className="top-1/3 right-20" />
        <AnimatedWeapon Icon={Axe} delay={2} className="bottom-40 left-1/4" />
        <AnimatedWeapon Icon={Shield} delay={0.5} className="bottom-20 right-1/4" />
        <AnimatedWeapon Icon={Flame} delay={1.5} className="top-40 right-1/3" />
      </div>

      {/* TOP NAV - Mobile Ready */}
      <LandingNav />

      <main>

      {/* HERO SECTION - Mobile Responsive */}
      <LandingHero />

      {/* MANA WORKFLOW EXPLANATION */}
      <ManaEngineDemo />

      {/* THE QUEST LOG (Features) */}
      <LandingFeatures />

      {/* PUBLIC EVIDENCE STATUS */}
      <GuildLeaderboardWins />
      </main>

      {/* GLOBAL NEO-BRUTALIST FOOTER */}
      <Footer />

    </div>
  )
}
