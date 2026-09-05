import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { SAMPLE_TARGETS } from '@/features/radar/data/sample-targets'

const sample = SAMPLE_TARGETS.find((target) => target.source === 'X')!

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-canvas px-4 pb-12 pt-28 sm:px-6 sm:pb-20 sm:pt-40">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="inline-flex rounded-full border border-outline bg-highlight px-3 py-2 text-xs font-semibold tracking-wide text-on-accent">
            Customer research for SaaS founders
          </p>
          <h1 className="font-display mt-6 text-4xl font-normal leading-[1.08] text-ink sm:text-6xl lg:text-[68px]">
            Find customer pain.<span className="mt-2 block text-forest italic">Choose your next move.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-ink-muted">
            Search public X conversations for problems, product frustrations, and requests for alternatives.
            Review the original posts before choosing what to build or who to talk to.
          </p>
      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/#demo" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-outline bg-accent px-6 py-4 text-base font-semibold text-on-accent transition-transform hover:-translate-y-0.5 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-ink">
              Try the demo <ArrowRight aria-hidden="true" size={20} />
            </Link>
            <Link href="/pricing" className="inline-flex min-h-12 items-center justify-center px-4 py-3 font-medium underline decoration-2 underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink">View plans</Link>
          </div>
          <p className="mt-4 text-sm font-medium text-ink-muted">Interactive sample. No signup needed. Real scans require a paid plan.</p>
        </div>

        <aside aria-label="Example research result" className="overflow-hidden rounded-[20px] border border-outline bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-outline bg-forest px-5 py-4 text-on-forest">
            <span className="text-xs font-semibold tracking-wide text-accent">Product preview</span>
            <span className="text-xs font-medium">Illustrative sample</span>
          </div>
      <div className="space-y-6 p-5 sm:p-7">
            <div>
              <p className="text-xs font-semibold tracking-wide text-ink-muted">Your research question</p>
              <h2 className="font-display mt-2 text-2xl font-medium leading-tight">Where does CRM onboarding break down?</h2>
            </div>
      <div className="rounded-[20px] border border-outline bg-highlight p-4 text-on-accent">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide"><Search aria-hidden="true" size={16} /> Sample X conversation</p>
              <p className="mt-3 text-lg font-semibold leading-snug">{sample.title}</p>
              <p className="mt-3 text-sm font-medium leading-relaxed">{sample.body}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-ink-muted">What to investigate</p>
              <p className="mt-2 font-medium leading-relaxed">Is migration verification a recurring blocker for teams switching CRMs?</p>
            </div>
            <p className="border-t border-outline pt-4 text-sm leading-relaxed text-ink-muted">This example is invented for the demo. In your scan results, review the source post and context before treating a match as an opportunity.</p>
            <Link href="/#demo" className="inline-flex min-h-11 items-center gap-2 font-semibold underline decoration-2 underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink">Explore the sample workflow <ArrowRight aria-hidden="true" size={18} /></Link>
          </div>
        </aside>
      </div>
    </section>
  )
}
