import React from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Sword, Compass } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { sfx } from '@/lib/sfx'
import BountyTickerBadge from '@/features/landing/components/BountyTickerBadge'

const HeroPixelSprite = dynamic(() => import('@/features/landing/components/HeroPixelSprite'), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse border-4 border-black bg-black/5 motion-reduce:animate-none sm:h-96" />
})

export function LandingHero() {
  const { isLoaded, userId } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } }
  }

  return (
    <section className="pt-28 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 sm:gap-16 relative z-10">
      <motion.div initial={shouldReduceMotion ? false : "hidden"} animate="visible" variants={fadeUp} className="flex-1 text-center lg:text-left">
        <BountyTickerBadge />
        <motion.h1 variants={fadeUp} className="text-4xl sm:text-7xl lg:text-[96px] font-black uppercase tracking-tighter leading-[0.95] text-black drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
          Stop Searching.<br/>
          <span className="text-[#ff4500] relative inline-block mt-1">
            Start Hunting.
            <svg className="absolute w-full h-3 sm:h-4 -bottom-1.5 sm:-bottom-2 left-0 text-black" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor"/>
            </svg>
          </span>
        </motion.h1>
        
        <motion.p variants={fadeUp} className="mt-6 sm:mt-8 text-lg sm:text-2xl md:text-3xl font-bold max-w-2xl mx-auto lg:mx-0 leading-tight">
          Turn a business idea into keyword-based customer research. Review stored source matches and decide what to do next.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-6 bg-[#ffd700] border-3 sm:border-4 border-black p-3.5 sm:p-4 font-extrabold text-sm sm:text-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-1 max-w-xl mx-auto lg:mx-0">
          Provider-backed scans can store matching posts. CoQuest does not promise intent, replies, or revenue from a match.
        </motion.div>
        
        <motion.div variants={fadeUp} className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
          {(!isLoaded || !userId) && (
            <Link href="/sign-up">
              <span 
                onClick={() => sfx.playCoinDrop()}
                onMouseEnter={() => sfx.playHoverBlip()}
                className="bg-[#ff4500] hover:bg-[#ff6b35] text-black px-8 sm:px-12 py-4 sm:py-5 border-3 sm:border-4 border-black font-black uppercase tracking-widest text-xl sm:text-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-[3px] hover:translate-x-[3px] active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                <Sword size={24} className="sm:w-7 sm:h-7" /> Create Free Account
              </span>
            </Link>
          )}
          {isLoaded && userId && (
            <Link
              href="/app"
              onClick={() => sfx.playCoinDrop()}
              className="bg-[#ff4500] hover:bg-[#ff6b35] text-black px-8 sm:px-12 py-4 sm:py-5 border-3 sm:border-4 border-black font-black uppercase tracking-widest text-xl sm:text-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-[3px] hover:translate-x-[3px] transition-all flex items-center justify-center gap-3"
            >
              <Compass aria-hidden="true" size={24} className="sm:w-7 sm:h-7" /> Open dashboard
            </Link>
          )}
        </motion.div>
      </motion.div>

      <motion.div 
        className="flex-1 w-full"
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
      >
        <HeroPixelSprite />
      </motion.div>
    </section>
  )
}
