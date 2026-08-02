'use client'

import React, { useState, useRef } from 'react'
import { motion, Variants } from 'framer-motion'
import { FlaskConical, Sparkles } from 'lucide-react'

import { useBillingSfx } from '@/features/billing/hooks/useBillingSfx'
import { useCountdown } from '@/features/billing/hooks/useCountdown'
import { useTypewriter } from '@/features/billing/hooks/useTypewriter'

import { BillingHero, DamageEntry } from '@/features/billing/components/BillingHero'
import { ManaShop } from '@/features/billing/components/ManaShop'
import { PlanGrid } from '@/features/billing/components/PlanGrid'
import { BillingEffectsLayer } from '@/features/billing/components/BillingEffectsLayer'

import { createManaCheckoutAction } from '@/features/billing/actions'

export type BrewStatus = 'idle' | 'brewing' | 'redirecting' | 'error'

export default function BillingPage() {
  const [activeEffect, setActiveEffect] = useState<'none' | 'peasant' | 'swordsman' | 'knight' | 'sorcerer' | 'dragon'>('none')
  const [userCredits, setUserCredits] = useState(100)
  const [purchasingPotion, setPurchasedPotion] = useState<string | null>(null)
  const [potionSuccess, setPotionSuccess] = useState<string | null>(null)
  const [refillNotification, setRefillNotification] = useState<number | null>(null)
  const [isRefilling, setIsRefilling] = useState(false)
  const [, setBrewStatus] = useState<BrewStatus>('idle')
  const [damageTexts, setDamageTexts] = useState<DamageEntry[]>([])
  const damageIdRef = useRef(0)

  const { sfxEnabled, setSfxEnabled, sfxBlip, sfxCoin } = useBillingSfx()

  const MAX_MANA = 10000
  const isLowMana = userCredits <= 500

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
    sfxCoin()
    setPurchasedPotion(potionId)
    setBrewStatus('brewing')

    // Trigger server checkout session if available
    try {
      const serverRes = await createManaCheckoutAction(potionId)
      if (serverRes.ok && serverRes.url) {
        setBrewStatus('redirecting')
        window.location.href = serverRes.url
        return
      }
    } catch {
      // Fallback to local demo brew visual if checkout key is not configured in dev
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

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 40 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } }
  }

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
            countdown={countdown}
            buyPotion={buyPotion}
            purchasingPotion={purchasingPotion}
            potionSuccess={potionSuccess}
          />

          <ManaShop
            itemVariants={item}
            buyPotion={buyPotion}
            purchasingPotion={purchasingPotion}
            potionSuccess={potionSuccess}
            sfxBlip={sfxBlip}
          />

          <PlanGrid
            itemVariants={item}
            triggerEffect={triggerEffect}
            sfxBlip={sfxBlip}
          />

        </motion.div>

        <BillingEffectsLayer activeEffect={activeEffect} />

      </div>
    </div>
  )
}
