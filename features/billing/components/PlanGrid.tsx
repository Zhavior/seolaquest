'use client'

import { CheckCircle2, CircleSlash2, LockKeyhole, Search } from 'lucide-react'

import type { BillingPlanView } from '@/features/billing/catalog'
import type { BillingAvailability, BillingReadyViewModel } from '@/features/billing/viewModel'
import type { PlanCode } from '@/src/modules/billing/domain/catalog'

type PlanGridProps = {
  plans: BillingPlanView[]
  currentPlan: BillingReadyViewModel['subscription']['plan']
  purchasingPlan: PlanCode | null
  checkoutAvailability: BillingAvailability
  onSelectPlan: (plan: PlanCode) => void
}

export function PlanGrid({
  plans,
  currentPlan,
  purchasingPlan,
  checkoutAvailability,
  onSelectPlan,
}: PlanGridProps) {
  return (
    <section aria-labelledby="billing-plans-heading" className="mt-12">
      <div className="border-b-4 border-black pb-4">
        <h2 id="billing-plans-heading" className="text-3xl font-black uppercase md:text-4xl">
          Canonical plan catalog
        </h2>
        <p className="mt-2 max-w-3xl text-sm font-bold text-zinc-600">
          Names, prices, included credits, and sellability come from the server catalog. Disabled plans grant nothing.
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.code
          const canCheckout = checkoutAvailability.state === 'available'
          const disabled = plan.code === 'FREE'
            || !plan.enabled
            || isCurrent
            || !canCheckout
            || purchasingPlan !== null
          const isPaidOffer = plan.code !== 'FREE' && plan.enabled

          return (
            <article
              key={plan.code}
              className={`flex min-h-[390px] flex-col border-4 border-black p-6 shadow-[7px_7px_0_0_#000] ${
                isPaidOffer ? 'bg-[#A3E635]' : plan.enabled ? 'bg-white' : 'bg-zinc-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-zinc-600">{plan.availabilityLabel}</p>
                  <h3 className="mt-1 text-2xl font-black uppercase">{plan.name}</h3>
                </div>
                {isPaidOffer ? <Search aria-hidden className="h-7 w-7" /> : plan.enabled
                  ? <CircleSlash2 aria-hidden className="h-7 w-7" />
                  : <LockKeyhole aria-hidden className="h-7 w-7" />}
              </div>

              <p className="mt-5 text-4xl font-black">{plan.priceLabel}</p>
              <p className="mt-2 text-xs font-black uppercase text-zinc-700">
                {plan.scanLimit} credits per qualifying paid invoice
              </p>

              <ul className="mt-6 flex-1 space-y-3 border-3 border-black bg-white p-4 text-sm font-bold">
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
                className="mt-6 min-h-12 w-full border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase text-white shadow-[4px_4px_0_0_#06B6D4] disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300 disabled:shadow-none"
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
                          : `Choose ${plan.name}`}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
