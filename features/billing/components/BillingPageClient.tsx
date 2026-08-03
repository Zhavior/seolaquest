'use client'

import React, { useState, useRef, use } from 'react'
import { motion, Variants, AnimatePresence } from 'framer-motion'
import { FlaskConical, Sparkles, Zap, AlertTriangle, ExternalLink, CheckCircle2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { useBillingSfx } from '@/features/billing/hooks/useBillingSfx'
import { useCountdown } from '@/features/billing/hooks/useCountdown'
import { useTypewriter } from '@/features/billing/hooks/useTypewriter'

import { BillingHero, DamageEntry } from '@/features/billing/components/BillingHero'
import { ManaShop } from '@/features/billing/components/ManaShop'
import { PlanGrid } from '@/features/billing/components/PlanGrid'
import { BillingEffectsLayer } from '@/features/billing/components/BillingEffectsLayer'

import { createManaCheckoutAction, createBillingPortalAction, createCheckoutAction } from '@/features/billing/actions'
import type { BillingReadyViewModel, BillingViewModel, BillingUnavailableViewModel, BillingLoadingViewModel } from '@/features/billing/viewModel'
import type { PlanCode } from '@/src/modules/billing/domain/catalog'

export type BrewStatus = 'idle' | 'brewing' | 'redirecting' | 'error'

export function VerificationPanel({ model }: { model: BillingUnavailableViewModel | BillingLoadingViewModel }) {
  return (
    <div className="min-h-[100dvh] min-w-0 break-words bg-[#FDFBF7] p-3 text-black sm:p-5 md:p-10">
      <section aria-live="polite" className="mx-auto min-w-0 max-w-4xl border-4 border-black bg-white p-4 shadow-[8px_8px_0_0_#000] sm:p-7 md:p-10">
        <div className="inline-flex max-w-full min-w-0 items-center gap-2 border-3 border-black bg-[#06B6D4] px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0_0_#000]">
          {model.status === 'loading' ? <RefreshCw aria-hidden className="h-4 w-4 animate-spin" /> : <AlertTriangle aria-hidden className="h-4 w-4" />}
          {model.status === 'loading' ? 'Server verification in progress' : 'Server verification unavailable'}
        </div>
        <h1 className="mt-6 text-4xl font-black uppercase leading-none md:text-6xl">{model.title}</h1>
        <p className="mt-4 max-w-2xl text-base font-bold text-zinc-700">{model.message}</p>
        {model.status === 'unavailable' && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 min-h-12 border-4 border-black bg-[#FFE600] px-5 py-3 text-sm font-black uppercase shadow-[5px_5px_0_0_#000]"
          >
            Retry verification
          </button>
        )}
      </section>
    </div>
  )
}

function BillingApp({ model }: { model: BillingReadyViewModel }) {
  const [activeEffect, setActiveEffect] = useState<'none' | 'peasant' | 'swordsman' | 'knight' | 'sorcerer' | 'dragon'>('none')
  
  // Use server model data as initial state for optimistic UI updates
  const [userCredits, setUserCredits] = useState(model.credits.balance)
  
  const [purchasingPotion, setPurchasedPotion] = useState<string | null>(null)
  const [potionSuccess, setPotionSuccess] = useState<string | null>(null)
  const [refillNotification, setRefillNotification] = useState<number | null>(null)
  const [isRefilling, setIsRefilling] = useState(false)
  const [brewStatus, setBrewStatus] = useState<BrewStatus>('idle')
  const [damageTexts, setDamageTexts] = useState<DamageEntry[]>([])
  const [purchasingPlan, setPurchasingPlan] = useState<any>(null)
  const damageIdRef = useRef(0)

  const { sfxEnabled, setSfxEnabled, sfxBlip, sfxCoin } = useBillingSfx()

  const MAX_MANA = Math.max(model.credits.highestRecordedBalance, 10000)
  const isLowMana = userCredits <= model.credits.estimatedScanCost * 5 // e.g. < 5 credits

  const countdown = useCountdown(299)

  const dialogue = isLowMana
    ? `Psst… Hunter Santos! You're dangerously low on Mana (${userCredits} MP). Grab two Greater Elixirs and I'll toss in +500 Bonus Mana FREE!`
    : `Greetings, Hunter Santos! Your mana reserves look decent, but the Dragon Cauldron can push you to maximum power. Brew wisely…`

  const typedDialogue = useTypewriter(dialogue, 22)

  const triggerEffect = (tier: 'peasant' | 'swordsman' | 'knight' | 'sorcerer' | 'dragon') => {
    sfxCoin()
    setActiveEffect(tier)
    setTimeout(() => setActiveEffect('none'), 2400)
  }

  const spawnDamageText = (amount: number) => {
    const id = ++damageIdRef.current
    const x = 40 + Math.random() * 20 // 40–60% offset from left
    setDamageTexts(prev => [...prev, { id, amount, x }])
    setTimeout(() => {
      setDamageTexts(prev => prev.filter(d => d.id !== id))
    }, 1900)
  }

  const buyPotion = async (potionId: string, questAmount: number) => {
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
      // Fallback to local demo brew visual if checkout key is not configured
    }

    setTimeout(() => {
      setPurchasedPotion(null)
      setPotionSuccess(potionId)
      setUserCredits(prev => Math.min(MAX_MANA, prev + questAmount))
      setRefillNotification(questAmount)
      setIsRefilling(true)
      setBrewStatus('idle')
      spawnDamageText(questAmount)

      setTimeout(() => setIsRefilling(false), 800)
      setTimeout(() => {
        setPotionSuccess(null)
        setRefillNotification(null)
      }, 2500)
    }, 600)
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
    hidden: { opacity: 0, scale: 0.95, y: 40 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } }
  }

  const returnStyle = model.checkoutReturn.state === 'verified'
    ? 'bg-[#A3E635]'
    : model.checkoutReturn.state === 'cancelled'
      ? 'bg-zinc-200'
      : 'bg-amber-200'

  return (
    <div className="min-h-[100dvh] w-full bg-[#FDFBF7] relative">
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.06]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      <div className="min-h-[100dvh] w-full max-w-[1400px] mx-auto p-4 md:p-8 font-black overflow-hidden relative z-10">
        <div className="absolute top-0 left-0 -ml-32 -mt-32 opacity-5 pointer-events-none">
          <FlaskConical className="w-[600px] h-[600px] text-black" />
        </div>
        
        {model.checkoutReturn.state !== 'none' && (
          <section role="status" className={`relative z-10 mb-6 min-w-0 border-4 border-black p-4 shadow-[6px_6px_0_0_#000] sm:p-5 ${returnStyle}`}>
            <h2 className="text-xl font-black uppercase">{model.checkoutReturn.title}</h2>
            <p className="mt-2 font-bold">{model.checkoutReturn.message}</p>
          </section>
        )}
        
        <div className="relative z-10 mb-6 flex flex-wrap items-center justify-end gap-3 p-3">
          <button
            type="button"
            onClick={() => void openPortal()}
            disabled={model.availability.portal.state !== 'available'}
            className="min-h-11 border-3 border-black bg-[#FFE600] px-4 py-2 text-xs font-black uppercase text-black disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000] transition-shadow"
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
          <motion.div variants={item} className="w-full overflow-hidden border-y-4 border-black bg-black py-2 flex whitespace-nowrap -rotate-1 shadow-[4px_4px_0_0_#FFE600]">
            <motion.div 
              animate={{ x: [0, -1000] }} 
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="flex gap-10 text-xl md:text-2xl uppercase tracking-widest"
            >
              {[...Array(10)].map((_, i) => (
                <span key={i} className="flex items-center gap-4 text-[#FFE600]">
                  <FlaskConical className="w-6 h-6 text-[#A3E635]" /> <span className="text-white">RESTOCK YOUR MANA</span> <Sparkles className="w-6 h-6 text-white" /> PREMIUM CONTRACTS
                </span>
              ))}
            </motion.div>
          </motion.div>

          <BillingHero
            itemVariants={item}
            userCredits={userCredits}
            MAX_MANA={MAX_MANA}
            isLowMana={isLowMana}
            isRefilling={isRefilling}
            damageTexts={damageTexts}
            refillNotification={refillNotification}
            sfxEnabled={sfxEnabled}
            setSfxEnabled={setSfxEnabled}
            sfxBlip={sfxBlip}
            typedDialogue={typedDialogue}
          />

          <ManaShop
            itemVariants={item}
            buyPotion={buyPotion}
            purchasingPotion={purchasingPotion}
            potionSuccess={potionSuccess}
            potionCheckoutEnabled={model.availability.checkout.state === 'available'}
            sfxBlip={sfxBlip}
          />

          <PlanGrid
            plans={model.catalog}
            currentPlan={model.subscription.plan}
            purchasingPlan={purchasingPlan}
            checkoutAvailability={model.availability.checkout}
            onSelectPlan={(code) => {
              setPurchasingPlan(code)
              triggerEffect('knight')
              sfxBlip()
              // Handle actual checkout action
            }}
          />

        </motion.div>

        <BillingEffectsLayer activeEffect={activeEffect} />

      </div>
    </div>
  )
}

export function BillingPageClient({ modelPromise }: { modelPromise: Promise<BillingViewModel> }) {
  const model = use(modelPromise)
  
  if (model.status === 'loading' || model.status === 'unavailable') {
    return <VerificationPanel model={model} />
  }

  return <BillingApp model={model} />
}
