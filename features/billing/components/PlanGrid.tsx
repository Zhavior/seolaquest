'use client'

import { useEffect, useRef } from 'react'
import { CheckCircle2, CircleSlash2, Crown, LockKeyhole, Search } from 'lucide-react'

import type { BillingPlanView } from '@/features/billing/catalog'
import type {
  BillingAvailability,
  BillingReadyViewModel,
  FounderPassView,
} from '@/features/billing/viewModel'
import type { PlanCode } from '@/src/modules/billing/domain/catalog'

type PlanGridProps = {
  plans: BillingPlanView[]
  currentPlan: BillingReadyViewModel['subscription']['plan']
  purchasingPlan: PlanCode | null
  checkoutAvailability: BillingAvailability
  founderPass: FounderPassView
  /** Set by `/billing?offer=founder`, so the Recharge CTA lands on the offer. */
  highlightPlan?: PlanCode | null
  onSelectPlan: (plan: PlanCode) => void
}

function FounderSeatCounter({ founderPass }: { founderPass: FounderPassView }) {
  const taken = founderPass.limit - founderPass.remaining
  const filled = founderPass.limit > 0 ? Math.round((taken / founderPass.limit) * 100) : 100

  return (
    <div className="mt-4 border border-outline bg-card p-3 rounded-xl">
      <p
        // Announced politely: the number moves as other people buy, and a live
        // seat count should never interrupt what the hunter is reading.
        aria-live="polite"
        className="text-xs font-semibold normal-case"
      >
        {founderPass.soldOut
          ? `All ${founderPass.limit} founder seats claimed`
          : `${founderPass.remaining} / ${founderPass.limit} founder seats remaining`}
      </p>

      <div className="mt-2 h-3 w-full border border-outline bg-canvas rounded-xl">
        <div className="h-full bg-accent-2" style={{ width: `${Math.min(100, filled)}%` }} />
      </div>

      {founderPass.reserved > 0 && !founderPass.soldOut ? (
        <p className="mt-2 text-[10px] font-bold normal-case text-ink-muted">
          {founderPass.reserved} held by checkouts in progress
        </p>
      ) : null}
    </div>
  )
}

export function PlanGrid({
  plans,
  currentPlan,
  purchasingPlan,
  checkoutAvailability,
  founderPass,
  highlightPlan,
  onSelectPlan,
}: PlanGridProps) {
  const highlightRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!highlightPlan) return
    // The model streams in behind Suspense, so a plain `#anchor` would resolve
    // before this section exists. Scroll once the card has actually rendered.
    highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightPlan])

  return (
    <section aria-labelledby="billing-plans-heading" className="mt-12">
      <div className="border-b border-outline pb-4">
        <h2 id="billing-plans-heading" className="text-3xl font-semibold normal-case md:text-4xl">
          Find the right provisions.
        </h2>
        <p className="mt-2 max-w-3xl text-sm font-bold text-ink-muted">
          Review the included credits and availability for each plan. Unavailable plans cannot be purchased.
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.code
          const canCheckout = checkoutAvailability.state === 'available'
          const isFounder = plan.code === 'FOUNDER'
          // A sold-out or unconfigured Founder Pass must not offer a button that
          // the server would only refuse. The seat cap is enforced at checkout;
          // this keeps the UI honest about it before the click.
          const founderBlocked = isFounder && !founderPass.sellable
          const disabled = plan.code === 'FREE'
            || !plan.enabled
            || isCurrent
            || !canCheckout
            || founderBlocked
            || purchasingPlan !== null
          const isPaidOffer = plan.code !== 'FREE' && plan.enabled
          const highlighted = highlightPlan === plan.code

          return (
            <article
              key={plan.code}
              id={`plan-${plan.code.toLowerCase()}`}
              ref={highlighted ? highlightRef : undefined}
              className={`flex min-h-[390px] flex-col border border-outline p-6 shadow-brutal-lg  rounded-xl ${
                isFounder ? 'bg-highlight' : plan.enabled ? 'bg-card' : 'bg-inset'
              } ${highlighted ? 'outline-4 outline-offset-4 outline-accent' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold normal-case text-ink-muted">{plan.availabilityLabel}</p>
                  <h3 className="mt-1 text-2xl font-semibold normal-case">{plan.name}</h3>
                </div>
                {isFounder ? <Crown aria-hidden className="h-7 w-7" /> : isPaidOffer
                  ? <Search aria-hidden className="h-7 w-7" />
                  : plan.enabled
                    ? <CircleSlash2 aria-hidden className="h-7 w-7" />
                    : <LockKeyhole aria-hidden className="h-7 w-7" />}
              </div>

              {isFounder ? (
                <p className="mt-3 inline-flex w-fit items-center gap-2 border border-outline bg-forest px-2 py-1 text-[10px] font-semibold normal-case tracking-wider text-[#FDE68A] rounded-xl">
                  <Crown aria-hidden className="h-3.5 w-3.5" /> Founder — price locked for life
                </p>
              ) : null}

              <p className="mt-5 text-4xl font-semibold">{plan.priceLabel}</p>
              <p className="mt-2 text-xs font-semibold normal-case text-ink-muted">
                {plan.scanLimit.toLocaleString()} credits per qualifying paid invoice
              </p>

              {isFounder ? <FounderSeatCounter founderPass={founderPass} /> : null}

              <ul className="mt-6 flex-1 space-y-3 border border-outline bg-card p-4 text-sm font-bold rounded-xl">
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-2">
                    <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onSelectPlan(plan.code)}
                disabled={disabled}
                className="mt-6 min-h-12 w-full border border-outline bg-forest px-4 py-3 text-sm font-semibold normal-case text-white shadow-brutal disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-ink-muted disabled:shadow-none rounded-xl"
              >
                {isCurrent
                  ? 'Current plan'
                  : !plan.enabled
                    ? 'Not for sale'
                    : plan.code === 'FREE'
                      ? 'Included account access'
                      : purchasingPlan === plan.code
                        ? 'Opening Stripe…'
                        : !canCheckout
                          ? checkoutAvailability.label
                          : founderBlocked
                            ? founderPass.soldOut ? 'Founder seats sold out' : 'Founder pass unavailable'
                            : `Choose ${plan.name}`}
              </button>

              {isFounder ? (
                <ul className="mt-4 space-y-2 border border-outline bg-card p-3 text-[11px] font-bold leading-snug rounded-xl">
                  {founderPass.lockTerms.map((term) => (
                    <li key={term}>{term}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
