'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Sword, 
  Flame, 
  Sparkles, 
  Crown, 
  Check, 
  FlaskConical, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from 'lucide-react'

export default function BillingPage() {
  const [activeEffect, setActiveEffect] = useState<'none' | 'swordsman' | 'knight' | 'sorcerer' | 'dragon'>('none')
  const [userCredits, setUserCredits] = useState(100000)
  const [purchasingPotion, setPurchasedPotion] = useState<string | null>(null)
  const [potionSuccess, setPotionSuccess] = useState<string | null>(null)

  // Trigger Combat Cinematic Effects on Upgrade
  const triggerEffect = (tier: 'swordsman' | 'knight' | 'sorcerer' | 'dragon') => {
    setActiveEffect(tier)
    setTimeout(() => setActiveEffect('none'), 2400)
  }

  // Handle Instant Potion Top-Up Purchase
  const buyPotion = (potionId: string, questAmount: number) => {
    setPurchasedPotion(potionId)
    setTimeout(() => {
      setPurchasedPotion(null)
      setPotionSuccess(potionId)
      setUserCredits((prev) => prev + questAmount)
      setTimeout(() => setPotionSuccess(null), 2000)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black p-4 md:p-8 space-y-10 max-w-7xl mx-auto">
      
      {/* 1. TOP STATUS HEADER BANNER */}
      <div className="bg-[#FFE600] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-black stroke-[2.5px]" />
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider">
              Guild Contracts & Mana Vault
            </h1>
          </div>
          <p className="font-bold text-xs md:text-sm mt-1">
            Summon new hero classes to scan social channels or refill your Mana with alchemical potions.
          </p>
        </div>

        {/* ACTIVE CREDIT BALANCE CHIP */}
        <div className="bg-black text-white p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] shrink-0 text-right">
          <div className="text-[10px] font-black uppercase text-[#A3E635]">ACTIVE MANA BALANCE</div>
          <div className="text-2xl font-black text-[#FFE600]">{userCredits.toLocaleString()} Quests</div>
        </div>
      </div>

      {/* 2. RECURRING SUBSCRIPTION CONTRACTS */}
      <div className="space-y-4">
        <div className="bg-[#A3E635] border-3 border-black p-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl md:text-2xl font-black uppercase flex items-center gap-2">
            <Sword className="w-6 h-6 stroke-[2.5px]" /> Monthly Hero Contracts
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* TIER 1: $15.99 SWORDSMAN */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#A3E635] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <span className="bg-black text-[#A3E635] font-black text-[10px] uppercase px-2 py-0.5 border border-black">
                🗡️ Rogue Warrior
              </span>
              <h3 className="text-2xl font-black uppercase mt-3">The Swordsman</h3>
              <div className="text-3xl font-black mt-1">$15.99 <span className="text-xs font-bold">/mo</span></div>
              <ul className="mt-4 space-y-2 font-bold text-xs bg-white text-black p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-700 stroke-[3px]" /> 2,500 Quests/mo</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-700 stroke-[3px]" /> Hourly Scans</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-700 stroke-[3px]" /> 1.5x XP Multiplier</li>
              </ul>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => triggerEffect('swordsman')}
              className="mt-6 w-full bg-white hover:bg-slate-100 text-black font-black uppercase py-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-sm"
            >
              <Sword className="w-4 h-4" /> Summon Swordsman
            </motion.button>
          </motion.div>

          {/* TIER 2: $24.99 KNIGHT */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#3B82F6] text-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <span className="bg-black text-[#3B82F6] font-black text-[10px] uppercase px-2 py-0.5 border border-white">
                🛡️ Paladin Guard
              </span>
              <h3 className="text-2xl font-black uppercase mt-3">The Knight</h3>
              <div className="text-3xl font-black mt-1">$24.99 <span className="text-xs font-bold">/mo</span></div>
              <ul className="mt-4 space-y-2 font-bold text-xs bg-white text-black p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-blue-600 stroke-[3px]" /> 6,000 Quests/mo</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-blue-600 stroke-[3px]" /> 15-Min Scans</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-blue-600 stroke-[3px]" /> Steel Knight Theme</li>
              </ul>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => triggerEffect('knight')}
              className="mt-6 w-full bg-[#FFE600] text-black font-black uppercase py-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-sm"
            >
              <Shield className="w-4 h-4" /> Equip Shield & Sword
            </motion.button>
          </motion.div>

          {/* TIER 3: $49.99 SORCERER */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#8B5CF6] text-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <span className="bg-black text-[#8B5CF6] font-black text-[10px] uppercase px-2 py-0.5 border border-white">
                🧙‍♂️ Arcane Mage
              </span>
              <h3 className="text-2xl font-black uppercase mt-3">The Sorcerer</h3>
              <div className="text-3xl font-black mt-1">$49.99 <span className="text-xs font-bold">/mo</span></div>
              <ul className="mt-4 space-y-2 font-bold text-xs bg-white text-black p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-purple-600 stroke-[3px]" /> 15,000 Quests/mo</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-purple-600 stroke-[3px]" /> 5-Min Real-time Scans</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-purple-600 stroke-[3px]" /> Webhook Integrations</li>
              </ul>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => triggerEffect('sorcerer')}
              className="mt-6 w-full bg-[#FFE600] text-black font-black uppercase py-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" /> Cast Arcane Storm
            </motion.button>
          </motion.div>

          {/* TIER 4: $199.00 DRAGON SLAYER */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#EF4444] text-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <span className="bg-black text-[#F59E0B] font-black text-[10px] uppercase px-2 py-0.5 border border-white">
                🐉 Dragon Overlord
              </span>
              <h3 className="text-2xl font-black uppercase mt-3">Dragon Slayer</h3>
              <div className="text-3xl font-black mt-1">$199.00 <span className="text-xs font-bold">/mo</span></div>
              <ul className="mt-4 space-y-2 font-bold text-xs bg-white text-black p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-red-600 stroke-[3px]" /> 100,000+ Quests/mo</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-red-600 stroke-[3px]" /> Dedicated Proxy Pool</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-red-600 stroke-[3px]" /> Global Leaderboard Crown</li>
              </ul>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => triggerEffect('dragon')}
              className="mt-6 w-full bg-[#F59E0B] text-black font-black uppercase py-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-sm"
            >
              <Flame className="w-4 h-4" /> Summon Dragon Fire
            </motion.button>
          </motion.div>

        </div>
      </div>

      {/* 3. THE ALCHEMIST'S MANA SHOP (ONE-TIME POTION REFILLS) */}
      <div className="space-y-4 pt-4 border-t-4 border-black border-dashed">
        <div className="bg-[#06B6D4] text-black border-3 border-black p-4 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-1">
          <h2 className="text-xl md:text-2xl font-black uppercase flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-black stroke-[2.5px] animate-bounce" />
            The Alchemist's Mana Shop (One-Time Refills)
          </h2>
          <p className="text-xs font-bold text-slate-800 mt-0.5">
            Running low on scan quota? Drink a Mana Potion to instantly inject quest credits into your account balance!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* POTION 1: $5.00 MINOR VIAL */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
          >
            <div>
              <span className="bg-[#06B6D4] text-black font-black text-[10px] uppercase px-2 py-0.5 border border-black">
                QUICK REFILL
              </span>
              <div className="w-16 h-16 mx-auto bg-cyan-100 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] my-3">
                <FlaskConical className="w-10 h-10 text-[#06B6D4] stroke-[2.5px]" />
              </div>
              <h3 className="font-black text-xl uppercase text-center">Minor Mana Vial</h3>
              <div className="text-3xl font-black text-center mt-1">+1,000 Quests</div>
              <p className="text-xs font-bold text-slate-600 text-center mt-2">
                Unlocks Potion Novice Badge. Ideal for quick social bursts.
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => buyPotion('minor', 1000)}
              disabled={purchasingPotion === 'minor'}
              className="mt-6 w-full bg-[#FFE600] hover:bg-yellow-300 font-black text-sm uppercase py-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              {potionSuccess === 'minor' ? (
                <><CheckCircle2 className="w-5 h-5 text-green-700 stroke-[3px]" /> REFILLED!</>
              ) : purchasingPotion === 'minor' ? (
                <Zap className="w-5 h-5 animate-spin" />
              ) : (
                <>Drink Potion ($5.00)</>
              )}
            </motion.button>
          </motion.div>

          {/* POTION 2: $10.00 GREATER ELIXIR */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#FFE600] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
          >
            <div>
              <span className="bg-[#A855F7] text-white font-black text-[10px] uppercase px-2 py-0.5 border border-black">
                MOST POPULAR ✨
              </span>
              <div className="w-16 h-16 mx-auto bg-purple-100 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] my-3">
                <Sparkles className="w-10 h-10 text-[#A855F7] stroke-[2.5px]" />
              </div>
              <h3 className="font-black text-xl uppercase text-center">Greater Mana Elixir</h3>
              <div className="text-3xl font-black text-center mt-1">+2,500 Quests</div>
              <p className="text-xs font-bold text-slate-800 text-center mt-2">
                Unlocks 1x Mystery Loot Drop. Perfect balance for active lead hunters.
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => buyPotion('greater', 2500)}
              disabled={purchasingPotion === 'greater'}
              className="mt-6 w-full bg-white hover:bg-slate-100 text-black font-black text-sm uppercase py-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              {potionSuccess === 'greater' ? (
                <><CheckCircle2 className="w-5 h-5 text-green-700 stroke-[3px]" /> REFILLED!</>
              ) : purchasingPotion === 'greater' ? (
                <Zap className="w-5 h-5 animate-spin" />
              ) : (
                <>Drink Elixir ($10.00)</>
              )}
            </motion.button>
          </motion.div>

          {/* POTION 3: $20.00 DRAGON'S CAULDRON */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-black text-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(255,230,0,1)] flex flex-col justify-between"
          >
            <div>
              <span className="bg-[#F59E0B] text-black font-black text-[10px] uppercase px-2 py-0.5 border border-black">
                BEST VALUE 👑
              </span>
              <div className="w-16 h-16 mx-auto bg-amber-950 border-2 border-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] my-3">
                <Flame className="w-10 h-10 text-[#F59E0B] stroke-[2.5px] fill-amber-500" />
              </div>
              <h3 className="font-black text-xl uppercase text-center text-[#F59E0B]">Dragon's Cauldron</h3>
              <div className="text-3xl font-black text-center mt-1 text-white">+6,000 Quests</div>
              <p className="text-xs font-bold text-slate-300 text-center mt-2">
                Unlocks Gold Dragon Profile Aura + 2,000 Bonus Hero XP!
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => buyPotion('dragon', 6000)}
              disabled={purchasingPotion === 'dragon'}
              className="mt-6 w-full bg-[#F59E0B] hover:bg-amber-400 text-black font-black text-sm uppercase py-3 border-2 border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center gap-2"
            >
              {potionSuccess === 'dragon' ? (
                <><CheckCircle2 className="w-5 h-5 text-black stroke-[3px]" /> REFILLED!</>
              ) : purchasingPotion === 'dragon' ? (
                <Zap className="w-5 h-5 animate-spin text-black" />
              ) : (
                <>Ignite Cauldron ($20.00)</>
              )}
            </motion.button>
          </motion.div>

        </div>
      </div>

      {/* 4. COMBAT CINEMATIC OVERLAY ON TIER UPGRADE */}
      <AnimatePresence>
        {activeEffect !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center pointer-events-none p-4"
          >
            {/* SWORDSMAN SLASH EFFECT */}
            {activeEffect === 'swordsman' && (
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1.5, rotate: 45 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-[#A3E635]"
              >
                <Sword className="w-36 h-36 stroke-[3px]" />
                <div className="bg-[#A3E635] text-black font-black text-2xl p-4 border-4 border-black mt-4">
                  🗡️ SWORDSMAN RECRUITED! (+1.5x XP Boost)
                </div>
              </motion.div>
            )}

            {/* KNIGHT SHIELD SLAM EFFECT */}
            {activeEffect === 'knight' && (
              <div className="relative flex items-center justify-center">
                <motion.div
                  initial={{ scale: 3, y: -120 }}
                  animate={{ scale: 1.2, y: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                >
                  <Shield className="w-40 h-40 text-slate-200 fill-slate-700 stroke-[3px]" />
                </motion.div>
                <motion.div
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 45, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="absolute"
                >
                  <Sword className="w-48 h-48 text-cyan-300 stroke-[3px]" />
                </motion.div>
              </div>
            )}

            {/* SORCERER ARCANE NOVA EFFECT */}
            {activeEffect === 'sorcerer' && (
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: [0, 1.5, 1], rotate: 360 }}
                transition={{ duration: 1 }}
                className="flex flex-col items-center gap-4 text-purple-400"
              >
                <Sparkles className="w-32 h-32 animate-pulse" />
                <div className="bg-[#8B5CF6] text-white font-black text-2xl p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  🧙‍♂️ ARCANE NOVA UNLEASHED! (5-Min Scans Active)
                </div>
              </motion.div>
            )}

            {/* DRAGON FIRE EFFECT */}
            {activeEffect === 'dragon' && (
              <motion.div
                initial={{ x: 300, scale: 0.5 }}
                animate={{ x: -300, scale: 2 }}
                transition={{ duration: 1.2 }}
                className="flex items-center gap-2 text-yellow-400"
              >
                <Flame className="w-28 h-28 fill-orange-500 text-yellow-400" />
                <span className="text-7xl font-black">🐉</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
