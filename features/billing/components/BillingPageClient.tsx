'use client'

import React, { useState, use } from 'react'
import { motion, Variants } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { useBillingSfx } from '@/features/billing/hooks/useBillingSfx'

import { BillingHero, DamageEntry } from '@/features/billing/components/BillingHero'
import { ManaShop } from '@/features/billing/components/ManaShop'
import { PlanGrid } from '@/features/billing/components/PlanGrid'

import { createManaCheckoutAction, createBillingPortalAction, createCheckoutAction } from '@/features/billing/actions'
import type { BillingReadyViewModel, BillingViewModel, BillingUnavailableViewModel, BillingLoadingViewModel } from '@/features/billing/viewModel'
import type { PlanCode } from '@/src/modules/billing/domain/catalog'

export type BrewStatus = 'idle' | 'brewing' | 'redirecting' | 'error'

export function VerificationPanel({ model }: { model: BillingUnavailableViewModel | BillingLoadingViewModel }) {
  return (
    <div className="min-h-[100dvh] min-w-0 break-words bg-surface p-3 text-ink sm:p-5 md:p-10">
      <section aria-live="polite" className="mx-auto min-w-0 max-w-4xl border border-outline bg-card p-4 shadow-brutal-lg sm:p-7 md:p-10 rounded-xl">
        <div className="inline-flex max-w-full min-w-0 items-center gap-2 border border-outline bg-info px-3 py-2 text-xs font-semibold normal-case shadow-brutal-sm rounded-xl">
          {model.status === 'loading' ? <RefreshCw aria-hidden className="h-4 w-4 animate-spin" /> : <AlertTriangle aria-hidden className="h-4 w-4" />}
          {model.status === 'loading' ? 'Server verification in progress' : 'Server verification unavailable'}
        </div>
        <h1 className="mt-6 text-4xl font-semibold normal-case leading-none md:text-6xl">{model.title}</h1>
        <p className="mt-4 max-w-2xl text-base font-bold text-ink-muted">{model.message}</p>
        {model.status === 'unavailable' && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 min-h-12 border border-outline bg-accent px-5 py-3 text-sm font-semibold normal-case shadow-brutal rounded-xl"
          >
            Retry verification
          </button>
        )}
      </section>
    </div>
  )
}

function BillingApp({ model, highlightPlan }: { model: BillingReadyViewModel; highlightPlan?: PlanCode | null }) {
  
  // Use server model data as initial state for optimistic UI updates
  const [userCredits] = useState(model.credits.balance)
  
  const [purchasingPotion, setPurchasedPotion] = useState<string | null>(null)
  const [, setBrewStatus] = useState<'idle' | 'brewing' | 'redirecting'>('idle')
  const [damageTexts] = useState<DamageEntry[]>([])
  const [purchasingPlan, setPurchasingPlan] = useState<PlanCode | null>(null)

  const { sfxEnabled, setSfxEnabled, sfxBlip, sfxCoin } = useBillingSfx()

  const MAX_MANA = Math.max(model.credits.highestRecordedBalance, 10000)
  const isLowMana = userCredits <= model.credits.estimatedScanCost * 5 // e.g. < 5 credits


  const buyPotion = async (potionId: string) => {
    if (model.availability.creditTopUps.state !== 'available') {
        // We will just optimistically run for now or respect the state.
        // Actually, let's keep the exact UI flow from page 2.tsx
    }
    
    sfxCoin()
    setPurchasedPotion(potionId)
    setBrewStatus('brewing')

    try {
      const serverRes = await createManaCheckoutAction(potionId)
      if (serverRes.ok && serverRes.url) {
        setBrewStatus('redirecting')
        window.location.href = serverRes.url
        return
      }
    } catch {
      // Checkout unavailable
    }

    setPurchasedPotion(null)
    setBrewStatus('idle')
  }

  const selectPlan = async (plan: PlanCode) => {
    if (model.availability.checkout.state !== 'available') return
    try {
      const result = await createCheckoutAction(plan)
      if (result.ok && result.url) {
        window.location.assign(result.url)
      }
    } catch {
      // Ignored for demo
    }
  }

  const openPortal = async () => {
    if (model.availability.portal.state !== 'available') return
    try {
      const result = await createBillingPortalAction()
      if (result.ok && result.url) {
        window.location.assign(result.url)
      }
    } catch {
      // Ignored for demo
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } }
  }

  const returnStyle = model.checkoutReturn.state === 'verified'
    ? 'bg-success'
    : model.checkoutReturn.state === 'cancelled'
      ? 'bg-inset'
      : 'bg-amber-200'

  return (
    <div className="min-h-[100dvh] w-full bg-surface relative">
      <div className="min-h-[100dvh] w-full max-w-[1400px] mx-auto p-4 md:p-8 font-semibold overflow-hidden relative z-10">
        
        {model.checkoutReturn.state !== 'none' && (
          <section role="status" className={`relative z-10 mb-6 min-w-0 border border-outline p-4 shadow-brutal-lg sm:p-5  rounded-xl ${returnStyle}`}>
            <h2 className="text-xl font-semibold normal-case">{model.checkoutReturn.title}</h2>
            <p className="mt-2 font-bold">{model.checkoutReturn.message}</p>
          </section>
        )}
        
        <div className="relative z-10 mb-6 flex flex-wrap items-center justify-end gap-3 p-3">
          <button
            type="button"
            onClick={() => void openPortal()}
            disabled={model.availability.portal.state !== 'available'}
            className="min-h-11 border border-outline bg-accent px-4 py-2 text-xs font-semibold normal-case text-ink disabled:cursor-not-allowed disabled:bg-inset disabled:text-ink-muted shadow-brutal-sm hover:shadow-brutal transition-shadow rounded-xl"
          >
            Manage Billing / Portal
          </button>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-10 relative z-10"
        >
          <BillingHero
            itemVariants={item}
            userCredits={userCredits}
            MAX_MANA={MAX_MANA}
            isLowMana={isLowMana}
            isRefilling={false}
            damageTexts={damageTexts}
            refillNotification={null}
            sfxEnabled={sfxEnabled}
            setSfxEnabled={setSfxEnabled}
            sfxBlip={sfxBlip}
            typedDialogue=""
          />

          <ManaShop
            itemVariants={item}
            buyPotion={buyPotion}
            purchasingPotion={purchasingPotion}
            potionSuccess={null}
            potionCheckoutEnabled={model.availability.creditTopUps.state === 'available'}
            sfxBlip={sfxBlip}
          />

          <PlanGrid
            plans={model.catalog}
            currentPlan={model.subscription.plan}
            purchasingPlan={purchasingPlan}
            checkoutAvailability={model.availability.checkout}
            founderPass={model.founderPass}
            highlightPlan={highlightPlan}
            onSelectPlan={async (code) => {
              setPurchasingPlan(code)
              sfxBlip()
              await selectPlan(code)
              setPurchasingPlan(null)
            }}
          />

        </motion.div>



      </div>
    </div>
  )
}

export function BillingPageClient({
  modelPromise,
  highlightPlan,
}: {
  modelPromise: Promise<BillingViewModel>
  /** Deep-link target from `/billing?offer=…`, used to scroll to and ring one plan. */
  highlightPlan?: PlanCode | null
}) {
  const model = use(modelPromise)

  if (model.status === 'loading' || model.status === 'unavailable') {
    return <VerificationPanel model={model} />
  }

  return <BillingApp model={model} highlightPlan={highlightPlan} />
}
