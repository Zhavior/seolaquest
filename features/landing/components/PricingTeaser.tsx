'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, CircleSlash2, Crown, Search, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { questBadge, questSurface } from '@/components/quest'
import { PLAN_CATALOG } from '@/src/modules/billing/domain/catalog'
import type { FounderSeatSnapshot } from '@/src/modules/billing/application/FounderSeatService'

// ---------------------------------------------------------------------------
// Display-layer overrides
// Underlying plan codes (FREE, BETA, FOUNDER) are what matter to billing.
// All mana figures come directly from the domain catalog — no duplication.
// ---------------------------------------------------------------------------
const FREE_TIER = {
  plan: PLAN_CATALOG.FREE,
  displayName: 'Free Scout',
  icon: CircleSlash2,
  // Mana terminology: 0 scan mana included on free tier
  benefits: [
    'Save & manage tracked keywords',
    'Unlimited keyword storage',
    '0 scan mana included — upgrade to scan',
  ],
  cta: 'Create free account',
  href: '/sign-up',
}

const BETA_TIER = {
  plan: PLAN_CATALOG.BETA,
  // User-specified display name override — "BETA Warrior", not "Beta Hunter"
  displayName: 'BETA Warrior',
  icon: Search,
  benefits: [
    // 1 Mana = 1 Scan — stated below section heading, reinforced in per-tier copy
    `${PLAN_CATALOG.BETA.scanLimit} mana / month`,
    'Saved results with original source links',
    'Access starts after verified payment',
  ],
  cta: 'Join as BETA Warrior',
  href: '/sign-up',
}

const FOUNDER_TIER = {
  plan: PLAN_CATALOG.FOUNDER,
  displayName: 'Founder Pass',
  icon: Crown,
  benefits: [
    `${PLAN_CATALOG.FOUNDER.scanLimit.toLocaleString()} mana / month — refreshes monthly`,
    'Your rate price-locked for life',
    '50-seat cap — enforced at checkout',
  ],
  cta: 'Claim Founder Pass',
  href: '/sign-up',
}

// ---------------------------------------------------------------------------
// Animation variants — mirrors LandingHero's fadeUp
// ---------------------------------------------------------------------------
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
}

// ---------------------------------------------------------------------------
// Shared CTA button styles
// Active states give the arcade "press" feel: translate + shadow shrink
// ---------------------------------------------------------------------------
const ctaBase =
  'flex w-full items-center justify-center gap-2 border-4 border-outline px-4 py-3 text-sm font-black uppercase tracking-[0.14em] shadow-brutal transition-all duration-75 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0'

const ctaGold = `${ctaBase} bg-accent text-on-accent`
const ctaEmber = `${ctaBase} bg-accent-2 text-white`
const ctaInkOnWhite = `${ctaBase} bg-black text-white`

// ---------------------------------------------------------------------------
// Sub-component: individual tier card
// ---------------------------------------------------------------------------
function TierCard({
  tier,
  founderSeats,
}: {
  tier: typeof FREE_TIER | typeof BETA_TIER | typeof FOUNDER_TIER
  founderSeats?: FounderSeatSnapshot | null
}) {
  const Icon = tier.icon
  const isBeta = tier.plan.code === 'BETA'
  const isFounder = tier.plan.code === 'FOUNDER'

  return (
    <motion.div
      variants={fadeUp}
      className={questSurface({
        tone: isFounder ? 'ink' : isBeta ? 'sand' : 'white',
        shadow: 'lg',
        border: 4,
        className: 'flex flex-col',
      })}
    >
      {/* Header */}
      <div className="border-b-4 border-outline p-6">
        <div className="flex items-start justify-between gap-3">
          <div
            className={questSurface({
              tone: 'gold',
              shadow: 'xs',
              border: 2,
              className: 'inline-flex h-10 w-10 shrink-0 items-center justify-center',
            })}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          {isFounder && (
            <span
              className={questBadge({
                tone: 'ember',
                shadow: 'xs',
                border: 2,
                className: 'text-[9px]',
              })}
            >
              Price-locked
            </span>
          )}
          {isBeta && (
            <span
              className={questBadge({
                tone: 'gold',
                shadow: 'xs',
                border: 2,
                className: 'text-[9px]',
              })}
            >
              Beta access
            </span>
          )}
        </div>

        <p className={`mt-4 text-[11px] font-black uppercase tracking-[0.2em] ${isFounder ? 'text-white/50' : 'text-ink-muted'}`}>
          {tier.displayName}
        </p>
        <p className={`mt-1 text-3xl font-black uppercase leading-none ${isFounder ? 'text-white' : 'text-ink'}`}>
          {tier.plan.priceLabel}
        </p>
      </div>

      {/* Benefits */}
      <ul className="flex flex-1 flex-col gap-3 p-6" role="list">
        {tier.benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm font-bold">
            <CheckCircle2
              className={`mt-0.5 h-4 w-4 shrink-0 ${isFounder ? 'text-white/50' : 'text-ink-muted'}`}
              aria-hidden="true"
            />
            <span className={isFounder ? 'text-white/85' : 'text-ink-muted'}>{b}</span>
          </li>
        ))}
      </ul>

      {/* Founder seat counter — degrades gracefully if DB unavailable */}
      {isFounder && founderSeats && (
        <div className="border-t-4 border-outline px-6 py-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-white/50">Seats remaining</span>
            <span className={founderSeats.soldOut ? 'text-accent-2' : 'text-white'}>
              {founderSeats.soldOut
                ? 'Sold out'
                : `${founderSeats.remaining} / ${founderSeats.limit}`}
            </span>
          </div>
          <div className="mt-2 h-2.5 border-2 border-outline bg-white/10">
            <div
              className="h-full bg-accent"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    ((founderSeats.limit - founderSeats.remaining) / founderSeats.limit) * 100,
                  ),
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* CTA — active state gives arcade press feel */}
      <div className="p-6 pt-0">
        <Link
          href={tier.href}
          className={isFounder ? ctaEmber : isBeta ? ctaInkOnWhite : ctaGold}
        >
          {tier.cta}
        </Link>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------
export interface PricingTeaserProps {
  founderSeats?: FounderSeatSnapshot | null
}

export function PricingTeaser({ founderSeats }: PricingTeaserProps) {
  const shouldReduceMotion = useReducedMotion()

  const motionProps = shouldReduceMotion
    ? {}
    : {
        variants: container,
        initial: 'hidden' as const,
        whileInView: 'show' as const,
        viewport: { once: true, margin: '-80px' },
      }

  return (
    <section
      className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24"
      aria-labelledby="pricing-teaser-heading"
    >
      {/* Section header */}
      <motion.div
        variants={fadeUp}
        initial={shouldReduceMotion ? false : 'hidden'}
        whileInView={shouldReduceMotion ? undefined : 'show'}
        viewport={{ once: true, margin: '-80px' }}
        className="mb-8"
      >
        <span
          className={questBadge({
            tone: 'gold',
            shadow: 'xs',
            border: 3,
            className: 'mb-4',
          })}
        >
          Guild Treasury
        </span>
        <h2
          id="pricing-teaser-heading"
          className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-ink sm:text-4xl"
        >
          Choose your guild rank
        </h2>
        {/* 1 Mana = 1 Scan — single explicit clarifier, shown once near pricing */}
        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-ink-muted">
          1 Mana = 1 Scan · Top up anytime · No hidden mana fees
        </p>
      </motion.div>

      {/* Cards */}
      <motion.div {...motionProps} className="grid gap-5 sm:grid-cols-3">
        <TierCard tier={FREE_TIER} />
        <TierCard tier={BETA_TIER} />
        <TierCard tier={FOUNDER_TIER} founderSeats={founderSeats} />
      </motion.div>

      {/* Full pricing link */}
      <motion.div
        variants={fadeUp}
        initial={shouldReduceMotion ? false : 'hidden'}
        whileInView={shouldReduceMotion ? undefined : 'show'}
        viewport={{ once: true, margin: '-80px' }}
        className="mt-6 text-center"
      >
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-ink underline decoration-2 underline-offset-4 transition-opacity hover:opacity-60"
        >
          See full pricing details
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </motion.div>
    </section>
  )
}
