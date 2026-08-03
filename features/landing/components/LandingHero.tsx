import React from 'react'
import { Sword, Compass } from 'lucide-react'
import Link from 'next/link'
import HeroPixelSprite from '@/features/landing/components/HeroPixelSprite'

export function LandingHero() {
  return (
    <section className="pt-28 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 sm:gap-16 relative z-10">
      <div className="flex-1 text-center lg:text-left">
        <div className="mb-4 inline-flex items-center border-2 border-black bg-[#FFE600] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] shadow-[3px_3px_0_0_#000]">
          Live keyword research workflow
        </div>

        <h1 className="text-4xl sm:text-7xl lg:text-[96px] font-black uppercase tracking-tighter leading-[0.95] text-black drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
          Stop Searching.<br />
          <span className="text-[#ff4500] relative inline-block mt-1">
            Start Hunting.
            <svg className="absolute w-full h-3 sm:h-4 -bottom-1.5 sm:-bottom-2 left-0 text-black" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
            </svg>
          </span>
        </h1>

        <p className="mt-6 sm:mt-8 text-lg sm:text-2xl md:text-3xl font-bold max-w-2xl mx-auto lg:mx-0 leading-tight">
          Turn a business idea into keyword-based customer research. Review stored source matches and decide what to do next.
        </p>

        <div className="mt-6 bg-[#ffd700] border-3 sm:border-4 border-black p-3.5 sm:p-4 font-extrabold text-sm sm:text-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-1 max-w-xl mx-auto lg:mx-0">
          Provider-backed scans can store matching posts. CoQuest does not promise intent, replies, or revenue from a match.
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
          <Link
            href="/sign-up"
            className="bg-[#ff4500] hover:bg-[#ff6b35] text-black px-8 sm:px-12 py-4 sm:py-5 border-3 sm:border-4 border-black font-black uppercase tracking-widest text-xl sm:text-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-[3px] hover:translate-x-[3px] active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <Sword size={24} className="sm:w-7 sm:h-7" /> Create Free Account
          </Link>

          <Link
            href="/sign-in"
            className="bg-white hover:bg-zinc-100 text-black px-8 sm:px-12 py-4 sm:py-5 border-3 sm:border-4 border-black font-black uppercase tracking-widest text-xl sm:text-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-[3px] hover:translate-x-[3px] active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <Compass aria-hidden="true" size={24} className="sm:w-7 sm:h-7" /> Sign In
          </Link>
        </div>
      </div>

      <div className="flex-1 w-full">
        <HeroPixelSprite />
      </div>
    </section>
  )
}
