'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
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
  Sprout
} from 'lucide-react'

export default function BillingPage() {
  const [activeEffect, setActiveEffect] = useState<'none' | 'peasant' | 'swordsman' | 'knight' | 'sorcerer' | 'dragon'>('none')
  const [userCredits, setUserCredits] = useState(100)
  const [purchasingPotion, setPurchasedPotion] = useState<string | null>(null)
  const [potionSuccess, setPotionSuccess] = useState<string | null>(null)
  const [hoveredPotion, setHoveredPotion] = useState<string | null>(null)
  const [refillNotification, setRefillNotification] = useState<number | null>(null)
  const [isRefilling, setIsRefilling] = useState(false)

  const MAX_MANA = 10000

  // Trigger Combat Cinematic Effects on Upgrade
  const triggerEffect = (tier: 'peasant' | 'swordsman' | 'knight' | 'sorcerer' | 'dragon') => {
    setActiveEffect(tier)
    setTimeout(() => setActiveEffect('none'), 2400)
  }

  // Handle Instant Potion Top-Up Purchase (Mock for visual upgrade)
  const buyPotion = (potionId: string, questAmount: number) => {
    setPurchasedPotion(potionId)
    setTimeout(() => {
      setPurchasedPotion(null)
      setPotionSuccess(potionId)
      setUserCredits((prev) => prev + questAmount)
      setRefillNotification(questAmount)
      setIsRefilling(true)
      
      setTimeout(() => {
        setIsRefilling(false)
      }, 800)

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
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.06]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />
      <div className="min-h-[100dvh] w-full max-w-[1400px] mx-auto p-4 md:p-8 font-black overflow-hidden relative z-10">
        
        {/* Background decoration */}
        <div className="absolute top-0 left-0 -ml-32 -mt-32 opacity-5 pointer-events-none">
          <FlaskConical className="w-[600px] h-[600px] text-black" />
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-10 relative z-10"
        >
        {/* Ticker Banner */}
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

        {/* Header Bento & Retro 8-Bit Liquid Mana Meter */}
        <motion.div variants={item} className="flex flex-col lg:flex-row gap-6">
          {/* Alchemist Shop Header */}
          <div className="flex-1 bg-[#A3E635] border-4 border-black p-6 md:p-8 shadow-[8px_8px_0_0_#000] flex flex-col justify-center relative overflow-hidden group" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px', backgroundPosition: '-2px -2px' }}>
            <div className="absolute inset-0 bg-[#A3E635] opacity-90 z-0"></div>
            <div className="relative z-10">
              <div className="bg-black text-white px-4 py-1 inline-block uppercase text-xs md:text-sm mb-3 border-2 border-white -rotate-2 shadow-[2px_2px_0_0_#fff]">
                Merchant's Guild
              </div>
              <h1 className="text-4xl md:text-7xl uppercase text-white" style={{ WebkitTextStroke: '2px black' }}>
                The Alchemist Shop
              </h1>
            </div>
            <Crown className="absolute -bottom-10 -right-10 w-64 h-64 text-black opacity-10 group-hover:scale-110 transition-transform duration-500" />
          </div>

          {/* 3. DYNAMIC RETRO 8-BIT LIQUID MANA METER */}
          <div className="lg:w-1/2 bg-black border-4 border-black p-6 shadow-[8px_8px_0_0_#06B6D4] flex flex-col justify-between relative overflow-hidden">
             <div className="flex items-center justify-between border-b-2 border-dashed border-[#06B6D4] pb-2 mb-3 z-10">
               <div className="flex items-center gap-2">
                 <Zap className="w-5 h-5 text-[#06B6D4] animate-pulse" />
                 <span className="text-[#06B6D4] uppercase text-xs md:text-sm font-black tracking-wider">
                   Active Mana Balance
                 </span>
               </div>
               <span className="bg-[#06B6D4] text-black px-2 py-0.5 text-[10px] md:text-xs font-black uppercase border border-black shadow-[2px_2px_0_0_#fff]">
                 RETRO MP METER
               </span>
             </div>

             <div className="flex items-baseline justify-between mb-3 z-10">
               <div className="text-4xl md:text-6xl font-black text-[#FFE600] tracking-tight" style={{ WebkitTextStroke: '1px black' }}>
                 {userCredits.toLocaleString()} <span className="text-lg md:text-2xl text-cyan-300 font-bold">MP</span>
               </div>
               <div className="text-xs text-cyan-200 uppercase font-mono font-bold">
                 CAP: {MAX_MANA.toLocaleString()} MP
               </div>
             </div>

             {/* 8-Bit Liquid Mana Bar */}
             <div className="w-full bg-slate-950 border-4 border-white p-1 relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] z-10">
               <motion.div
                 animate={{
                   width: `${Math.min(100, Math.max(4, (userCredits / MAX_MANA) * 100))}%`,
                   scale: isRefilling ? [1, 1.03, 1] : 1
                 }}
                 transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                 className="h-7 md:h-8 bg-gradient-to-r from-cyan-500 via-teal-400 to-[#A3E635] relative overflow-hidden shadow-[0_0_15px_#06B6D4]"
               >
                 {/* Shimmer overlay effect */}
                 <motion.div
                   animate={{ x: ['-100%', '100%'] }}
                   transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                   className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                 />
               </motion.div>

               {/* Retro Segment Grid Ticks */}
               <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
                 {[...Array(12)].map((_, i) => (
                   <div key={i} className="w-[2px] h-full bg-black/50 border-r border-white/20" />
                 ))}
               </div>
             </div>

             {/* Refill Floating Popup Text */}
             <AnimatePresence>
               {refillNotification && (
                 <motion.div
                   initial={{ y: 20, opacity: 0, scale: 0.8 }}
                   animate={{ y: -30, opacity: 1, scale: 1.15 }}
                   exit={{ y: -50, opacity: 0 }}
                   transition={{ duration: 1.5 }}
                   className="absolute top-2 right-4 bg-[#FFE600] text-black border-2 border-black font-black text-xs md:text-sm px-3 py-1 shadow-[4px_4px_0_0_#000] z-30"
                 >
                   +{refillNotification.toLocaleString()} MANA REFILLED! 🧪✨
                 </motion.div>
               )}
             </AnimatePresence>

             <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-[#06B6D4] opacity-10 pointer-events-none" />
          </div>
        </motion.div>

        {/* 2. "GUILD DISCOUNT" BARGAIN MECHANICS (GAMIFIED UPSELLS) */}
        <motion.div variants={item} className="bg-[#FFE600] border-4 border-black p-5 md:p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            {/* NPC Merchant Portrait */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 bg-amber-200 border-4 border-black rounded-full flex items-center justify-center text-3xl shadow-[3px_3px_0_0_#000] group">
                🧙‍♂️
              </div>
              <div className="absolute -bottom-1 -right-1 bg-black text-[#FFE600] text-[9px] font-black uppercase px-1.5 py-0.5 border border-white shadow-[1px_1px_0_0_#000]">
                NPC
              </div>
            </div>

            {/* Merchant Speech & Deal */}
            <div>
              <div className="bg-black text-[#A3E635] border-2 border-white px-2.5 py-0.5 inline-block text-xs font-black uppercase mb-1 shadow-[2px_2px_0_0_#000] -rotate-1">
                Merchant's Bargain 📜
              </div>
              <h3 className="text-lg md:text-2xl font-black uppercase text-black leading-tight">
                “Haggle with the Alchemist: Buy 2 Greater Elixirs, get +500 Bonus Mana!”
              </h3>
              <p className="text-xs md:text-sm font-bold text-slate-900 mt-0.5">
                Combo Refill: 5,000 MP + 500 Bonus = <span className="bg-black text-white px-2 py-0.5 ml-1 inline-block border border-black shadow-[2px_2px_0_0_#A3E635]">+5,500 TOTAL MANA</span>
              </p>
            </div>
          </div>

          {/* Bargain CTA Button */}
          <button
            onClick={() => buyPotion('bargain', 5500)}
            disabled={purchasingPotion === 'bargain'}
            className="w-full md:w-auto flex-shrink-0 bg-black hover:bg-zinc-800 text-[#FFE600] font-black text-base uppercase px-6 py-3.5 border-4 border-white shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2 relative z-10"
          >
            {potionSuccess === 'bargain' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#A3E635]" /> [BARGAIN CLAIMED!]
              </>
            ) : purchasingPotion === 'bargain' ? (
              <Zap className="w-5 h-5 animate-spin text-[#FFE600]" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#A3E635]" /> [CLAIM BARGAIN - $20.00]
              </>
            )}
          </button>
        </motion.div>

        {/* THE MANA SHOP - Bento Row with Hover Micro-Animations */}
        <motion.div variants={item}>
          <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
            <div className="bg-[#06B6D4] p-3 border-4 border-black shadow-[4px_4px_0_0_#000]">
              <FlaskConical className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl uppercase">Consumable Potions</h2>
              <p className="text-xs font-bold text-slate-600">Hover over any potion button to sip & preview magic aura 🧪✨</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* 1. Minor Vial */}
            <motion.div 
              initial="rest" 
              whileHover="hover" 
              whileTap="tap" 
              animate="rest"
              onHoverStart={() => setHoveredPotion('minor')}
              onHoverEnd={() => setHoveredPotion(null)}
              className="bg-white border-4 border-black p-6 flex flex-col justify-between group relative overflow-visible shadow-[6px_6px_0_0_#000]"
            >
              <div className="absolute top-0 right-0 bg-[#06B6D4] text-black border-l-4 border-b-4 border-black px-3 py-1 uppercase text-sm shadow-[-4px_4px_0_0_#000] font-black z-10">
                Quick Refill
              </div>

              {/* Hover Bubbly Particle Animation */}
              {hoveredPotion === 'minor' && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.span
                      key={i}
                      initial={{ y: 0, opacity: 0, scale: 0.5 }}
                      animate={{
                        y: [-10, -40, -55],
                        x: [(i % 2 === 0 ? -15 : 15), (i % 2 === 0 ? 20 : -20)],
                        opacity: [0, 1, 0],
                        scale: [0.6, 1.3, 0.4]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.1,
                        delay: i * 0.25,
                        ease: "easeOut"
                      }}
                      className="text-xl select-none"
                    >
                      {i % 2 === 0 ? '✨' : '🧪'}
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Tilting Potion Flask Icon */}
              <motion.div 
                animate={{
                  rotate: hoveredPotion === 'minor' ? 45 : 0,
                  scale: hoveredPotion === 'minor' ? 1.15 : 1
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                className="w-24 h-24 mx-auto bg-cyan-100 border-4 border-black flex items-center justify-center my-6 shadow-[6px_6px_0_0_#000]"
              >
                <FlaskConical className="w-12 h-12 text-[#06B6D4]" />
              </motion.div>

              <h3 className="font-black text-2xl uppercase text-center">Minor Vial</h3>
              <p className="text-4xl font-black text-center mt-2 text-[#06B6D4]" style={{ WebkitTextStroke: '1px black' }}>+1,000 MP</p>
              
              <button
                onClick={() => buyPotion('minor', 1000)}
                disabled={purchasingPotion === 'minor'}
                onMouseEnter={() => setHoveredPotion('minor')}
                onMouseLeave={() => setHoveredPotion(null)}
                className="mt-8 w-full bg-[#FFE600] hover:bg-yellow-300 font-black text-lg md:text-xl uppercase py-4 border-4 border-black shadow-[6px_6px_0_0_#000] active:shadow-none active:translate-y-1.5 active:translate-x-1.5 transition-all flex items-center justify-center gap-2"
              >
                {potionSuccess === 'minor' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : purchasingPotion === 'minor' ? (
                  <Zap className="w-6 h-6 animate-spin" />
                ) : (
                  '[DRINK VIAL - $5.00]'
                )}
              </button>
            </motion.div>

            {/* 2. Greater Elixir */}
            <motion.div 
              initial="rest" 
              whileHover="hover" 
              whileTap="tap" 
              animate="rest"
              onHoverStart={() => setHoveredPotion('greater')}
              onHoverEnd={() => setHoveredPotion(null)}
              className="bg-[#FFE600] border-4 border-black p-6 flex flex-col justify-between group relative overflow-visible shadow-[6px_6px_0_0_#000]"
            >
              <div className="absolute top-0 left-0 bg-[#A855F7] text-white border-r-4 border-b-4 border-black px-3 py-1 uppercase text-sm shadow-[4px_4px_0_0_#000] font-black z-10">
                Most Popular
              </div>

              {/* Hover Bubbly Particle Animation */}
              {hoveredPotion === 'greater' && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.span
                      key={i}
                      initial={{ y: 0, opacity: 0, scale: 0.5 }}
                      animate={{
                        y: [-10, -40, -55],
                        x: [(i % 2 === 0 ? -15 : 15), (i % 2 === 0 ? 20 : -20)],
                        opacity: [0, 1, 0],
                        scale: [0.6, 1.3, 0.4]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.1,
                        delay: i * 0.25,
                        ease: "easeOut"
                      }}
                      className="text-xl select-none"
                    >
                      {i % 2 === 0 ? '🟣' : '✨'}
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Tilting Flask Icon */}
              <motion.div 
                animate={{
                  rotate: hoveredPotion === 'greater' ? -45 : 0,
                  scale: hoveredPotion === 'greater' ? 1.15 : 1
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                className="w-24 h-24 mx-auto bg-white border-4 border-black flex items-center justify-center my-6 shadow-[6px_6px_0_0_#000]"
              >
                <Sparkles className="w-12 h-12 text-[#A855F7]" />
              </motion.div>

              <h3 className="font-black text-2xl uppercase text-center">Greater Elixir</h3>
              <p className="text-4xl font-black text-center mt-2 text-black">+2,500 MP</p>
              
              <button
                onClick={() => buyPotion('greater', 2500)}
                disabled={purchasingPotion === 'greater'}
                onMouseEnter={() => setHoveredPotion('greater')}
                onMouseLeave={() => setHoveredPotion(null)}
                className="mt-8 w-full bg-white hover:bg-slate-100 text-black font-black text-lg md:text-xl uppercase py-4 border-4 border-black shadow-[6px_6px_0_0_#000] active:shadow-none active:translate-y-1.5 active:translate-x-1.5 transition-all flex items-center justify-center gap-2"
              >
                {potionSuccess === 'greater' ? (
                  <CheckCircle2 className="w-6 h-6 text-purple-700" />
                ) : purchasingPotion === 'greater' ? (
                  <Zap className="w-6 h-6 animate-spin" />
                ) : (
                  '[DRINK ELIXIR - $10.00]'
                )}
              </button>
            </motion.div>

            {/* 3. Dragon Cauldron */}
            <motion.div 
              initial="rest" 
              whileHover="hover" 
              whileTap="tap" 
              animate="rest"
              onHoverStart={() => setHoveredPotion('dragon_potion')}
              onHoverEnd={() => setHoveredPotion(null)}
              className="bg-[#FF5722] border-4 border-black p-6 flex flex-col justify-between group relative overflow-visible shadow-[6px_6px_0_0_#000]" 
              style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}
            >
              <div className="absolute inset-0 bg-[#FF5722] opacity-90 z-0"></div>
              <div className="absolute top-0 right-0 bg-black text-[#F59E0B] border-l-4 border-b-4 border-white px-3 py-1 uppercase text-sm shadow-[-4px_4px_0_0_#F59E0B] z-10 font-black">
                Best Value
              </div>

              {/* Hover Bubbly Particle Animation */}
              {hoveredPotion === 'dragon_potion' && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.span
                      key={i}
                      initial={{ y: 0, opacity: 0, scale: 0.5 }}
                      animate={{
                        y: [-10, -40, -55],
                        x: [(i % 2 === 0 ? -15 : 15), (i % 2 === 0 ? 20 : -20)],
                        opacity: [0, 1, 0],
                        scale: [0.6, 1.3, 0.4]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.1,
                        delay: i * 0.25,
                        ease: "easeOut"
                      }}
                      className="text-xl select-none"
                    >
                      {i % 2 === 0 ? '🔥' : '🐉'}
                    </motion.span>
                  ))}
                </div>
              )}
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  {/* Tilting Flask Icon */}
                  <motion.div 
                    animate={{
                      rotate: hoveredPotion === 'dragon_potion' ? 45 : 0,
                      scale: hoveredPotion === 'dragon_potion' ? 1.15 : 1
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                    className="w-24 h-24 mx-auto bg-black border-4 border-white flex items-center justify-center my-6 shadow-[6px_6px_0_0_#F59E0B]"
                  >
                    <Flame className="w-12 h-12 text-[#F59E0B]" />
                  </motion.div>

                  <h3 className="font-black text-2xl uppercase text-center text-white" style={{ WebkitTextStroke: '1px black' }}>Dragon Cauldron</h3>
                  <p className="text-4xl font-black text-center mt-2 text-[#FFE600] drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">+6,000 MP</p>
                </div>
                
                <button
                  onClick={() => buyPotion('dragon_potion', 6000)}
                  disabled={purchasingPotion === 'dragon_potion'}
                  onMouseEnter={() => setHoveredPotion('dragon_potion')}
                  onMouseLeave={() => setHoveredPotion(null)}
                  className="mt-8 w-full bg-black hover:bg-zinc-800 text-[#F59E0B] font-black text-lg md:text-xl uppercase py-4 border-4 border-white shadow-[6px_6px_0_0_#F59E0B] active:shadow-none active:translate-y-1.5 active:translate-x-1.5 transition-all flex items-center justify-center gap-2"
                >
                  {potionSuccess === 'dragon_potion' ? (
                    <CheckCircle2 className="w-6 h-6 text-[#F59E0B]" />
                  ) : purchasingPotion === 'dragon_potion' ? (
                    <Zap className="w-6 h-6 animate-spin" />
                  ) : (
                    '[DRINK CAULDRON - $20.00]'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* 4. SUBSCRIPTIONS WITH CLASS PERK LISTS & LAYOUT FIX */}
        <motion.div variants={item}>
          <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4 mt-12">
            <div className="bg-[#A855F7] p-3 border-4 border-black shadow-[4px_4px_0_0_#000]">
              <Sword className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl uppercase">Hero Contracts (Monthly)</h2>
              <p className="text-xs font-bold text-slate-600">Choose your Guild Class & unlock specialized RPG Perks</p>
            </div>
          </div>

          {/* Clean layout wrapper ensuring cards never clip on right edge */}
          <div className="w-full overflow-x-auto pb-8 pt-2 px-1 scrollbar-thin">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 min-w-full">
              
              {/* 1. The Peasant */}
              <motion.div initial="rest" whileHover="hover" whileTap="tap" animate="rest" className="bg-[#D4D4D8] border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between relative overflow-hidden group min-w-[240px]">
                <div>
                  <div className="bg-black text-[#D4D4D8] uppercase px-3 py-1 inline-block font-black text-xs mb-3 shadow-[3px_3px_0_0_#fff] -rotate-2 border-2 border-white relative z-10">
                    Free Tier
                  </div>
                  <h3 className="text-3xl uppercase text-black relative z-10" style={{ WebkitTextStroke: '1px white' }}>The Peasant</h3>
                  <p className="text-3xl font-black mt-2 text-black drop-shadow-[2px_2px_0_rgba(255,255,255,1)] relative z-10">$0 <span className="text-lg text-black">/mo</span></p>
                  
                  {/* Class Perk List */}
                  <ul className="mt-6 space-y-3 font-extrabold text-xs md:text-sm bg-white text-black p-4 border-4 border-black shadow-[4px_4px_0_0_#000] relative z-10">
                    <li className="flex items-center gap-2">🌾 <span>+100 Auto-Replies / Mo</span></li>
                    <li className="flex items-center gap-2">🔍 <span>Basic Manual Scans</span></li>
                    <li className="flex items-center gap-2">🛡️ <span>Standard 1x XP Rate</span></li>
                    <li className="flex items-center gap-2">📜 <span>Public Guild Support</span></li>
                  </ul>
                </div>
                
                <button
                  onClick={() => triggerEffect('peasant')}
                  className="mt-6 w-full bg-black hover:bg-zinc-800 text-[#D4D4D8] font-black text-sm uppercase py-3 border-4 border-white shadow-[4px_4px_0_0_#fff] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2 relative z-10"
                >
                  <Sprout className="w-4 h-4" /> [START FARMING]
                </button>
                <Sprout className="absolute -bottom-8 -right-8 w-48 h-48 text-black opacity-10 group-hover:scale-110 transition-transform duration-500" />
              </motion.div>

              {/* 2. The Swordsman */}
              <motion.div initial="rest" whileHover="hover" whileTap="tap" animate="rest" className="bg-[#A3E635] border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between relative overflow-hidden group min-w-[240px]">
                <div>
                  <div className="bg-black text-[#A3E635] uppercase px-3 py-1 inline-block font-black text-xs mb-3 shadow-[3px_3px_0_0_#fff] -rotate-2 border-2 border-white relative z-10">
                    Tier 0
                  </div>
                  <h3 className="text-3xl uppercase text-black relative z-10" style={{ WebkitTextStroke: '1px white' }}>The Swordsman</h3>
                  <p className="text-3xl font-black mt-2 text-black drop-shadow-[2px_2px_0_rgba(255,255,255,1)] relative z-10">$15.99 <span className="text-lg text-black">/mo</span></p>
                  
                  {/* Class Perk List */}
                  <ul className="mt-6 space-y-3 font-extrabold text-xs md:text-sm bg-white text-black p-4 border-4 border-black shadow-[4px_4px_0_0_#000] relative z-10">
                    <li className="flex items-center gap-2">🗡️ <span>+2,500 Auto-Replies / Mo</span></li>
                    <li className="flex items-center gap-2">📜 <span>Real-time Reddit & X Radar</span></li>
                    <li className="flex items-center gap-2">⚡ <span>5x Faster Scout Speed</span></li>
                    <li className="flex items-center gap-2">👑 <span>Priority Guild Support</span></li>
                  </ul>
                </div>
                
                <button
                  onClick={() => triggerEffect('swordsman')}
                  className="mt-6 w-full bg-black hover:bg-zinc-800 text-[#A3E635] font-black text-sm uppercase py-3 border-4 border-white shadow-[4px_4px_0_0_#fff] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2 relative z-10"
                >
                  <Sword className="w-4 h-4" /> [RECRUIT SWORDSMAN]
                </button>
                <Sword className="absolute -bottom-8 -right-8 w-48 h-48 text-black opacity-10 group-hover:scale-110 transition-transform duration-500" />
              </motion.div>

              {/* 3. The Knight */}
              <motion.div initial="rest" whileHover="hover" whileTap="tap" animate="rest" className="bg-[#3B82F6] border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between relative overflow-hidden group min-w-[240px]">
                <div>
                  <div className="bg-black text-white uppercase px-3 py-1 inline-block font-black text-xs mb-3 shadow-[3px_3px_0_0_#fff] -rotate-2 border-2 border-white relative z-10">
                    Tier 1
                  </div>
                  <h3 className="text-3xl uppercase text-white relative z-10" style={{ WebkitTextStroke: '1px black' }}>The Knight</h3>
                  <p className="text-3xl font-black mt-2 text-[#FFE600] drop-shadow-[2px_2px_0_rgba(0,0,0,1)] relative z-10">$24.99 <span className="text-lg text-white">/mo</span></p>
                  
                  {/* Class Perk List */}
                  <ul className="mt-6 space-y-3 font-extrabold text-xs md:text-sm bg-white text-black p-4 border-4 border-black shadow-[4px_4px_0_0_#000] relative z-10">
                    <li className="flex items-center gap-2">🗡️ <span>+6,000 Auto-Replies / Mo</span></li>
                    <li className="flex items-center gap-2">📜 <span>Real-time Reddit & X Radar</span></li>
                    <li className="flex items-center gap-2">⚡ <span>15-Min Rapid Scout</span></li>
                    <li className="flex items-center gap-2">👑 <span>Priority Guild Support</span></li>
                  </ul>
                </div>
                
                <button
                  onClick={() => triggerEffect('knight')}
                  className="mt-6 w-full bg-[#FFE600] hover:bg-yellow-300 text-black font-black text-sm uppercase py-3 border-4 border-black shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2 relative z-10"
                >
                  <Shield className="w-4 h-4" /> [EQUIP SHIELD]
                </button>
                <Shield className="absolute -bottom-8 -right-8 w-48 h-48 text-black opacity-20 group-hover:scale-110 transition-transform duration-500" />
              </motion.div>

              {/* 4. The Sorcerer */}
              <motion.div initial="rest" whileHover="hover" whileTap="tap" animate="rest" className="bg-[#8B5CF6] border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between relative overflow-hidden group min-w-[240px]">
                <div>
                  <div className="bg-[#FFE600] text-black uppercase px-3 py-1 inline-block font-black text-xs mb-3 shadow-[3px_3px_0_0_#000] rotate-2 border-2 border-black relative z-10">
                    Tier 2 (Pro)
                  </div>
                  <h3 className="text-3xl uppercase text-white relative z-10" style={{ WebkitTextStroke: '1px black' }}>The Sorcerer</h3>
                  <p className="text-3xl font-black mt-2 text-[#FFE600] drop-shadow-[2px_2px_0_rgba(0,0,0,1)] relative z-10">$49.99 <span className="text-lg text-white">/mo</span></p>
                  
                  {/* Class Perk List */}
                  <ul className="mt-6 space-y-3 font-extrabold text-xs md:text-sm bg-white text-black p-4 border-4 border-black shadow-[4px_4px_0_0_#000] relative z-10">
                    <li className="flex items-center gap-2">🔮 <span>+15,000 Auto-Replies / Mo</span></li>
                    <li className="flex items-center gap-2">📜 <span>Real-time Reddit & X Radar</span></li>
                    <li className="flex items-center gap-2">⚡ <span>5x Faster Scout Speed</span></li>
                    <li className="flex items-center gap-2">👑 <span>Priority Guild Support</span></li>
                  </ul>
                </div>
                
                <button
                  onClick={() => triggerEffect('sorcerer')}
                  className="mt-6 w-full bg-black hover:bg-zinc-800 text-white font-black text-sm uppercase py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(255,230,0,1)] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2 relative z-10"
                >
                  <Sparkles className="w-4 h-4 text-[#FFE600]" /> [CAST ARCANE NOVA]
                </button>
                <Sparkles className="absolute -bottom-8 -right-8 w-48 h-48 text-black opacity-20 group-hover:rotate-12 transition-transform duration-500" />
              </motion.div>

              {/* 5. Dragon Slayer */}
              <motion.div initial="rest" whileHover="hover" whileTap="tap" animate="rest" className="bg-[#EF4444] border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between relative overflow-hidden group min-w-[240px]">
                <div>
                  <div className="bg-black text-[#F59E0B] uppercase px-3 py-1 inline-block font-black text-xs mb-3 shadow-[3px_3px_0_0_#F59E0B] rotate-2 border-2 border-white relative z-10">
                    Dragon Overlord
                  </div>
                  <h3 className="text-3xl uppercase text-white relative z-10" style={{ WebkitTextStroke: '1px black' }}>Dragon Slayer</h3>
                  <p className="text-3xl font-black mt-2 text-[#FFE600] drop-shadow-[2px_2px_0_rgba(0,0,0,1)] relative z-10">$199.00 <span className="text-lg text-white">/mo</span></p>
                  
                  {/* Class Perk List */}
                  <ul className="mt-6 space-y-3 font-extrabold text-xs md:text-sm bg-white text-black p-4 border-4 border-black shadow-[4px_4px_0_0_#000] relative z-10">
                    <li className="flex items-center gap-2">🐉 <span>+100,000+ Auto-Replies / Mo</span></li>
                    <li className="flex items-center gap-2">📜 <span>Real-time Reddit & X Radar</span></li>
                    <li className="flex items-center gap-2">⚡ <span>Instant Scout Speed</span></li>
                    <li className="flex items-center gap-2">👑 <span>Priority Guild Support</span></li>
                  </ul>
                </div>
                
                <button
                  onClick={() => triggerEffect('dragon')}
                  className="mt-6 w-full bg-[#F59E0B] hover:bg-amber-400 text-black font-black text-sm uppercase py-3 border-4 border-black shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2 relative z-10"
                >
                  <Flame className="w-4 h-4" /> [SUMMON DRAGON]
                </button>
                <Flame className="absolute -bottom-8 -right-8 w-48 h-48 text-black opacity-20 group-hover:scale-110 transition-transform duration-500" />
              </motion.div>
            </div>
          </div>
        </motion.div>

      </motion.div>

      {/* COMBAT CINEMATIC OVERLAY ON TIER UPGRADE */}
      <AnimatePresence>
        {activeEffect !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center pointer-events-none p-4"
          >
            {activeEffect === 'peasant' && (
              <motion.div 
                initial={{ scale: 0, y: 50 }}
                animate={{ scale: 1.2, y: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="flex flex-col items-center text-zinc-300"
              >
                <Sprout className="w-36 h-36 stroke-[3px]" />
                <div className="bg-zinc-300 text-black font-black text-2xl p-4 border-4 border-black mt-4 shadow-[4px_4px_0_0_#fff]">
                  🌱 PEASANT AWAKENED! (Time to work)
                </div>
              </motion.div>
            )}

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

            {activeEffect === 'knight' && (
              <div className="relative flex flex-col items-center justify-center gap-8">
                <div className="relative">
                  <motion.div initial={{ scale: 3, y: -120 }} animate={{ scale: 1.2, y: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 15 }}>
                    <Shield className="w-48 h-48 text-slate-200 fill-slate-700 stroke-[3px]" />
                  </motion.div>
                  <motion.div initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 45, opacity: 1 }} transition={{ delay: 0.3, duration: 0.3 }} className="absolute inset-0 flex items-center justify-center">
                    <Sword className="w-64 h-64 text-cyan-300 stroke-[3px]" />
                  </motion.div>
                </div>
                <div className="bg-[#3B82F6] text-white font-black text-3xl p-6 border-4 border-white shadow-[6px_6px_0_0_#fff] uppercase text-center max-w-lg leading-tight">
                  Knight Contract Signed! <br/><span className="text-[#FFE600]">Shield Equipped.</span>
                </div>
              </div>
            )}

            {activeEffect === 'sorcerer' && (
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: [0, 1.5, 1], rotate: 360 }}
                transition={{ duration: 1 }}
                className="flex flex-col items-center gap-8 text-purple-400"
              >
                <Sparkles className="w-48 h-48 animate-pulse text-[#A855F7]" />
                <div className="bg-[#8B5CF6] text-white font-black text-3xl p-6 border-4 border-white shadow-[6px_6px_0_0_#fff] uppercase text-center max-w-lg leading-tight">
                  Sorcerer Contract Signed! <br/><span className="text-[#FFE600]">Arcane Nova Unleashed.</span>
                </div>
              </motion.div>
            )}

            {activeEffect === 'dragon' && (
              <motion.div
                initial={{ x: 300, scale: 0.5 }}
                animate={{ x: -300, scale: 2 }}
                transition={{ duration: 1.2 }}
                className="flex flex-col items-center gap-8 text-yellow-400"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-48 h-48 fill-orange-500 text-yellow-400" />
                  <span className="text-9xl font-black">🐉</span>
                </div>
                <div className="bg-[#EF4444] text-white font-black text-3xl p-6 border-4 border-white shadow-[6px_6px_0_0_#F59E0B] uppercase text-center max-w-lg leading-tight">
                  Dragon Overlord Summoned! <br/><span className="text-[#FFE600]">Fire Breathed.</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  )
}
