'use client'

import { useReducedMotion } from 'framer-motion'
import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SAMPLE_TARGETS } from '@/features/radar/data/sample-targets'

const PixelParticleBackground = dynamic(() => import('./PixelParticleBackground'), { ssr: false })
const sample = SAMPLE_TARGETS.find((target) => target.source === 'X')!

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden bg-canvas px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
      {shouldReduceMotion ? null : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40">
          <PixelParticleBackground />
        </div>
      )}
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="inline-flex border-2 border-outline bg-accent px-3 py-2 text-xs font-black uppercase tracking-widest text-on-accent shadow-brutal-sm">
            Customer research for SaaS founders
          </p>
          <h1 className="mt-6 text-4xl font-black uppercase leading-[1.02] tracking-[-0.05em] text-ink sm:text-6xl lg:text-[68px]">
            Find customer pain.<span className="mt-2 block text-[#D93B0F]">Choose your next move.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-bold leading-relaxed text-ink-muted">
            Search public X conversations for problems, product frustrations, and requests for alternatives.
            Review the original posts before choosing what to build or who to talk to.
          </p>
          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/#demo" className="inline-flex min-h-12 items-center justify-center gap-3 border-4 border-outline bg-black px-6 py-4 text-base font-black uppercase tracking-wider text-white shadow-[4px_4px_0_0_#ff5a36] transition-transform hover:-translate-y-0.5 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-ink">
              Try the demo <ArrowRight aria-hidden="true" size={20} />
            </Link>
            <Link href="/pricing" className="inline-flex min-h-12 items-center justify-center px-4 py-3 font-bold underline decoration-2 underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink">View plans</Link>
          </div>
          <p className="mt-4 text-sm font-medium text-ink-muted">Interactive sample. No signup needed. Real scans require a paid plan.</p>
        </div>

        <aside aria-label="Example research result" className="border-4 border-outline bg-card shadow-brutal-lg">
          <div className="flex items-center justify-between gap-4 border-b-4 border-outline bg-black px-5 py-4 text-white">
            <span className="text-xs font-black uppercase tracking-widest text-[#FFE600]">Product preview</span>
            <span className="text-xs font-bold">Illustrative sample</span>
          </div>
          <div className="space-y-6 p-5 sm:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-ink-muted">Your research question</p>
              <h2 className="mt-2 text-2xl font-black leading-tight">Where does CRM onboarding break down?</h2>
            </div>
            <div className="border-2 border-outline bg-highlight p-4 text-on-accent">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider"><Search aria-hidden="true" size={16} /> Sample X conversation</p>
              <p className="mt-3 text-lg font-black leading-snug">{sample.title}</p>
              <p className="mt-3 text-sm font-medium leading-relaxed">{sample.body}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-ink-muted">What to investigate</p>
              <p className="mt-2 font-bold leading-relaxed">Is migration verification a recurring blocker for teams switching CRMs?</p>
            </div>
            <p className="border-t-2 border-outline pt-4 text-sm leading-relaxed text-ink-muted">This example is invented for the demo. In your scan results, review the source post and context before treating a match as an opportunity.</p>
            <Link href="/#demo" className="inline-flex min-h-11 items-center gap-2 font-black underline decoration-2 underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink">Explore the sample workflow <ArrowRight aria-hidden="true" size={18} /></Link>
          </div>
        </aside>
      </div>
    </section>
  )
}
