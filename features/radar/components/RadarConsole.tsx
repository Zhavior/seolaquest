'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Compass,
  Crosshair,
  Info,
  Radar,
  Send,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

import { Footer } from '@/components/Footer'
import { LandingNav } from '@/features/landing/components/LandingNav'
import type { BillingPlanView } from '@/features/billing/catalog'
import {
  NOISE_SAMPLES,
  SAMPLE_TARGETS,
} from '../data/sample-targets'
import { RadarDemo } from './RadarDemo'
import { ReplyDrawer } from './ReplyDrawer'
import { Reveal } from './Reveal'

/** Shared chrome. Every panel on the page is the same slab. */
const PANEL = 'border border-outline bg-card shadow-brutal rounded-xl'
const CHIP =
  'border border-outline bg-card px-3 py-1.5 font-mono text-[11px] font-semibold normal-case tracking-[0.18em] text-ink shadow-brutal-sm rounded-xl'
const EYEBROW =
  'inline-flex items-center gap-2 border border-outline bg-accent px-3 py-1.5 text-[11px] font-semibold normal-case tracking-[0.24em] text-on-accent shadow-brutal sm:text-xs rounded-xl'
const HEADING = 'text-3xl font-semibold normal-case leading-[1.05] tracking-tight text-ink sm:text-4xl lg:text-5xl'

export function RadarConsole({ plans }: { plans: BillingPlanView[] }) {
  const prefersReducedMotion = usePrefersReducedMotion()

  // This section sits outside `RadarDemo`, so the "Kept" example gets its own
  // drawer rather than reaching into the demo's state. Only one can be open at
  // a time, which is all a modal needs to behave.
  const [keptOpen, setKeptOpen] = useState(false)
  const [keptCopied, setKeptCopied] = useState(false)

  const copyKeptDraft = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_TARGETS[0].suggestedReply)
      setKeptCopied(true)
      setTimeout(() => setKeptCopied(false), 2500)
    } catch {
      // Clipboard access is denied in some contexts; the draft stays selectable.
    }
  }

  // Cheapest first. The catalog is keyed for lookup, not for display, so its
  // object order would put the most expensive plan in the middle.
  const planOrder: BillingPlanView['code'][] = ['FREE', 'BETA', 'FOUNDER']
  const sellablePlans = plans
    .filter((plan) => plan.enabled)
    .sort((a, b) => planOrder.indexOf(a.code) - planOrder.indexOf(b.code))

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas font-sans text-ink selection:bg-[#ff4500] selection:text-white">
      <LandingNav />

      <main className="relative z-10 pt-16 sm:pt-20">
        {/* ── 1 · Hero ─────────────────────────────────────────────────── */}
        {/* Scoped to the hero, exactly as the landing page scopes it: the
            field is `absolute inset-0`, so mounting it at page root stretched a
            single WebGL canvas over all ~6,300px of the document. */}
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="relative z-10 mx-auto max-w-7xl">
          <Reveal className="max-w-3xl space-y-6">
            <p className={EYEBROW}>
              <Radar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Interactive demo · sample data</span>
            </p>

            <h1 className="text-4xl font-semibold normal-case leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              See what the radar does
              <span className="mt-2 block text-ink-muted">before you sign up</span>
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              SEOlaQuest reads public threads on <strong className="font-bold text-ink">X</strong> for
              people describing a problem your product solves, then helps you draft a reply worth
              posting. Reddit reading is built but not switched on yet, so the sample set below
              includes Reddit threads to show the shape it will take. Everything on this page runs
              against that fixed sample set, with nothing connected.
            </p>

            <div className="flex flex-wrap gap-2">
              {['Scanning X', 'Buyer-intent scoring', 'Live signal review', 'Evidence-first workflow'].map(
                (item) => (
                  <span key={item} className={CHIP}>
                    {item}
                  </span>
                ),
              )}
            </div>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <a
                href="#scope"
                className="group inline-flex items-center justify-center gap-3 border border-outline bg-ink px-8 py-4 text-lg font-semibold normal-case tracking-[0.14em] text-ink-inverse shadow-brutal transition-all duration-75 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-brutal-sm rounded-xl"
              >
                <Crosshair className="h-5 w-5 transition-transform group-hover:rotate-45" aria-hidden="true" />
                <span>Run the simulator</span>
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-3 border border-outline bg-card px-8 py-4 text-lg font-semibold normal-case tracking-[0.14em] text-ink shadow-brutal-lg transition-all duration-75 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:bg-highlight active:translate-x-[3px] active:translate-y-[3px] active:shadow-brutal-sm rounded-xl"
              >
                <Compass className="h-5 w-5" aria-hidden="true" />
                <span>See real pricing</span>
              </Link>
            </div>

            <div className="flex items-start gap-3 border border-outline bg-highlight p-4 shadow-brutal rounded-xl">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-on-accent" aria-hidden="true" />
              <p className="text-sm text-on-accent">
                <span className="block font-semibold normal-case tracking-[0.14em]">Zero fake proof</span>
                Every handle, thread and score below is written for the demo. No account is connected,
                nothing here is a customer, and none of it is a measured result.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-14 flex justify-center">
            <a
              href="#scope"
              className="flex flex-col items-center gap-1 font-mono text-[11px] font-semibold normal-case tracking-[0.22em] text-ink-muted transition-colors hover:text-ink"
            >
              <span>Scroll to scan</span>
              <ChevronDown
                className={cn('h-5 w-5', !prefersReducedMotion && 'motion-safe:animate-bounce')}
                aria-hidden="true"
              />
            </a>
            </Reveal>
          </div>
        </section>


        <RadarDemo />

        {/* ── 5 · Noise vs signal ──────────────────────────────────────── */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl space-y-10">
            <Reveal className="max-w-3xl space-y-4">
              <p className={EYEBROW}>
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Illustrative comparison</span>
              </p>
              <h2 className={HEADING}>What gets filtered out, and what survives</h2>
              <p className="text-base text-ink-muted sm:text-lg">
                Both columns are written examples, not captured threads. They show the kind of post the
                filter is built to drop and the kind it is built to keep.
              </p>
            </Reveal>

            <div className="grid gap-8 lg:grid-cols-2">
              <Reveal className={cn('space-y-4 p-6', PANEL)}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline pb-3">
                  <h3 className="flex items-center gap-2 font-mono text-sm font-semibold normal-case tracking-[0.18em] text-ink">
                    <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
                    <span>Dropped</span>
                  </h3>
                  <span className="font-mono text-[10px] font-semibold normal-case tracking-[0.16em] text-ink-muted">
                    {NOISE_SAMPLES.length} written examples
                  </span>
                </div>

                <ul className="space-y-3">
                  {NOISE_SAMPLES.map((item) => (
                    <li key={item.who} className="space-y-1 border border-outline bg-inset p-3 rounded-xl">
                      <p className="font-mono text-[10px] font-semibold normal-case tracking-[0.16em] text-ink-muted">
                        {item.who}
                      </p>
                      <p className="text-sm text-ink">&ldquo;{item.text}&rdquo;</p>
                      <p className="font-mono text-[11px] font-semibold normal-case tracking-[0.12em] text-danger-ink">
                        Dropped — {item.why}
                      </p>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.1} className="space-y-4 border border-outline bg-card p-6 shadow-brutal rounded-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline pb-3">
                  <h3 className="flex items-center gap-2 font-mono text-sm font-semibold normal-case tracking-[0.18em] text-ink">
                    <Sparkles className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                    <span>Kept</span>
                  </h3>
                </div>

                <ul className="space-y-3">
                  {SAMPLE_TARGETS.slice(0, 2).map((target) => (
                    <li key={target.id} className="space-y-2 border border-outline bg-highlight p-3.5 rounded-xl">
                      <p className="font-mono text-[10px] font-semibold normal-case tracking-[0.16em] text-on-accent">
                        {target.handle} · {target.source}
                      </p>
                      <p className="text-sm font-bold text-on-accent">&ldquo;{target.title}&rdquo;</p>
                      <p className="flex flex-wrap gap-1.5 font-mono text-[10px] font-semibold normal-case tracking-[0.12em]">
                        <span className="border border-outline bg-card px-1.5 py-0.5 text-ink rounded-xl">
                          {target.painPoint}
                        </span>
                        <span className="border border-outline bg-accent-2 px-1.5 py-0.5 text-on-accent rounded-xl">
                          Names the tool
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setKeptOpen(true)}
                  className="flex w-full items-center justify-center gap-2 border border-outline bg-ink py-3 font-mono text-[11px] font-semibold normal-case tracking-[0.18em] text-ink-inverse shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none rounded-xl"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>Open the draft for the first one</span>
                </button>
              </Reveal>
            </div>
          </div>
        </section>


        {/* ── 6 · Pricing, from the billing catalog ────────────────────── */}
        <section className="border-y border-outline bg-surface px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl space-y-10">
            <Reveal className="max-w-3xl space-y-4">
              <p className={EYEBROW}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Beta pricing</span>
              </p>
              <h2 className={HEADING}>What access actually costs</h2>
              <p className="text-base text-ink-muted sm:text-lg">
                These plans come straight from the billing catalog this site charges against, so the page
                cannot drift from the invoice.
              </p>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-3">
              {sellablePlans.map((plan, index) => (
                <Reveal key={plan.code} delay={index * 0.08}>
                  <div className={cn('flex h-full flex-col justify-between gap-6 p-6', PANEL)}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-outline pb-3">
                        <h3 className="font-mono text-sm font-semibold normal-case tracking-[0.18em] text-ink">
                          {plan.name}
                        </h3>
                        <span className="border border-outline bg-inset px-2 py-0.5 font-mono text-[10px] font-semibold normal-case tracking-[0.12em] text-ink-muted rounded-xl">
                          {plan.availabilityLabel}
                        </span>
                      </div>
                      <p className="text-4xl font-semibold text-ink">{plan.priceLabel}</p>
                      <ul className="space-y-2.5 text-sm text-ink">
                        {plan.benefits.map((benefit) => (
                          <li key={benefit} className="flex gap-2">
                            <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href="/pricing"
                      className="border border-outline bg-accent px-4 py-3 text-center font-mono text-[11px] font-semibold normal-case tracking-[0.18em] text-on-accent shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none rounded-xl"
                    >
                      Plan details
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <ReplyDrawer
        open={keptOpen}
        target={SAMPLE_TARGETS[0]}
        draft={SAMPLE_TARGETS[0].suggestedReply}
        draftLabel="Draft reply"
        copied={keptCopied}
        onCopy={copyKeptDraft}
        onClose={() => setKeptOpen(false)}
        reducedMotion={prefersReducedMotion}
      />
    </div>
  )
}
