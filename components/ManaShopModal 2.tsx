'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  Sparkles,
  Flame,
  X,
  CheckCircle2,
  Zap,
  KeyRound,
  RefreshCw
} from 'lucide-react'
import { sfx } from '@/lib/sfx'
import { createManaCheckoutAction } from '@/features/billing/actions'

interface ManaShopModalProps {
  onClose: () => void
  onPurchaseSuccess?: (questsAdded: number) => void
}

export default function ManaShopModal({ onClose, onPurchaseSuccess }: ManaShopModalProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [purchasedId, setPurchasedId] = useState<string | null>(null)
  const [currentMana, setCurrentMana] = useState(() => {
    if (typeof window === 'undefined') return 3400
    try {
      const savedMana = localStorage.getItem('coquest_mana_balance')
      return savedMana ? parseInt(savedMana, 10) : 3400
    } catch {
      return 3400
    }
  })
  const [maxMana] = useState(10000)
  const [extraSlots, setExtraSlots] = useState(() => {
    if (typeof window === 'undefined') return 0
    try {
      const savedSlots = localStorage.getItem('coquest_extra_rune_slots')
      return savedSlots ? parseInt(savedSlots, 10) : 0
    } catch {
      return 0
    }
  })
  const [hasArcaneSpeed, setHasArcaneSpeed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const savedSpeed = localStorage.getItem('coquest_arcane_speed_unlocked')
      return savedSpeed === 'true'
    } catch {
      return false
    }
  })
  const [autoRefill, setAutoRefill] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      const savedAuto = localStorage.getItem('coquest_auto_refill_mana')
      return savedAuto ? savedAuto === 'true' : true
    } catch {
      return true
    }
  })
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBuyPotion = async (id: string, name: string, mpAmount: number, _priceStr: string) => {
    sfx.playCoinDrop()
    setSelectedItem(id)

    try {
      const res = await createManaCheckoutAction(id)
      if (res.ok && res.url) {
        window.location.href = res.url
        return
      }
    } catch {
      // fallback mock behavior for visual showcase
    }

    // Demo purchase success simulation
    setTimeout(() => {
      sfx.playElixirDrink()
      const newMana = Math.min(maxMana * 2, currentMana + mpAmount)
      setCurrentMana(newMana)
      setPurchasedId(id)
      setSelectedItem(null)

      try {
        localStorage.setItem('coquest_mana_balance', newMana.toString())
      } catch {}

      if (onPurchaseSuccess) onPurchaseSuccess(mpAmount)
      setToastMessage(`🧪 +${mpAmount.toLocaleString()} MP Refilled to Mana Vault!`)
      setTimeout(() => setPurchasedId(null), 2000)
      setTimeout(() => setToastMessage(null), 3500)
    }, 600)
  }

  const handleBuyVaultPerk = (id: string, name: string, perkType: 'slot' | 'speed') => {
    sfx.playCoinDrop()
    setSelectedItem(id)

    setTimeout(() => {
      sfx.playElixirDrink()
      setPurchasedId(id)
      setSelectedItem(null)

      if (perkType === 'slot') {
        const nextSlots = extraSlots + 1
        setExtraSlots(nextSlots)
        try {
          localStorage.setItem('coquest_extra_rune_slots', nextSlots.toString())
        } catch {}
        setToastMessage(`🔓 Extra Rune Slot unlocked! Active limit is now ${1 + nextSlots} keys.`)
      } else {
        setHasArcaneSpeed(true)
        try {
          localStorage.setItem('coquest_arcane_speed_unlocked', 'true')
        } catch {}
        setToastMessage(`⚡ Arcane Speed Scroll Activated! 100 req/sec execution unlocked.`)
      }

      setTimeout(() => setPurchasedId(null), 2000)
      setTimeout(() => setToastMessage(null), 3500)
    }, 600)
  }

  const toggleAutoRefill = () => {
    sfx.playHoverBlip()
    const nextVal = !autoRefill
    setAutoRefill(nextVal)
    try {
      localStorage.setItem('coquest_auto_refill_mana', String(nextVal))
    } catch {}
    setToastMessage(nextVal ? '🔄 Auto-Refill enabled at < 10% Mana!' : '⏸️ Auto-Refill disabled.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const manaPercentage = Math.min(100, Math.round((currentMana / maxMana) * 100))

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className="relative w-full max-w-4xl bg-[#F4F0EA] text-black border-4 border-black p-5 sm:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            sfx.playHoverBlip()
            onClose()
          }}
          className="absolute top-4 right-4 bg-white hover:bg-black hover:text-white border-3 border-black p-1.5 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-20 cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[3px]" />
        </button>

        {/* 🧪 Header Banner */}
        <div className="space-y-4">
          <div className="bg-[#FFE600] border-4 border-black p-4 md:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="bg-black text-[#FFE600] p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <FlaskConical className="w-8 h-8 stroke-[2.5px] animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 border border-black font-mono">
                  MARKETPLACE & MANA REFILL CENTER
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-black mt-0.5">
                  THE ALCHEMIST SHOP
                </h2>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold text-zinc-800 mt-2">
              Refill your Mana Tank or upgrade your API Rune Vault for external bots, Zapier integrations, and Discord webhooks.
            </p>
          </div>

          {/* Live SVG Mana Tank Meter */}
          <div className="bg-black border-4 border-black p-4 text-white shadow-[6px_6px_0px_0px_rgba(6,182,212,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 bg-[#06B6D4] text-black border-2 border-white shadow-[2px_2px_0_0_#fff]">
                <FlaskConical className="w-6 h-6 stroke-[3px]" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-cyan-400 font-mono tracking-widest">
                  LIVE MANA VAULT TANK
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-[#FFE600]">
                  {currentMana.toLocaleString()} <span className="text-xs text-zinc-400 font-sans">/ {maxMana.toLocaleString()} MP</span>
                </div>
              </div>
            </div>

            {/* SVG Wave Bar */}
            <div className="w-full sm:w-64 relative">
              <div className="relative h-8 w-full bg-zinc-900 border-2 border-white overflow-hidden shadow-[2px_2px_0_0_#000]">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#06B6D4] via-[#38BDF8] to-[#10B981]"
                  animate={{ width: `${manaPercentage}%` }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase font-mono tracking-widest text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {manaPercentage}% MANA CAPACITY
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#10B981] text-black font-black text-xs sm:text-sm p-3 border-3 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-between"
              >
                <span>{toastMessage}</span>
                <CheckCircle2 className="w-5 h-5 text-black stroke-[3px]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🧪 SECTION 1: CONSUMABLE MANA REFILLS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b-3 border-black pb-1.5">
              <FlaskConical className="w-5 h-5 text-[#06B6D4] stroke-[3px]" />
              <h3 className="font-black text-base uppercase text-black">
                1. Consumable &quot;Mana Refills&quot; (Pay-as-You-Go API Credits)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Potion 1: Minor Mana Vial */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-white border-3 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase bg-[#06B6D4] text-white px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                    [POTION #1] 🧪 MINOR VIAL
                  </span>
                  <span className="text-lg font-black text-black font-mono">$5.00</span>
                </div>

                <div className="flex items-start gap-3 my-2">
                  <div className="w-12 h-12 bg-cyan-50 border-2 border-black flex-shrink-0 flex items-center justify-center shadow-[2px_2px_0_0_#000]">
                    <FlaskConical className="w-6 h-6 text-[#06B6D4] stroke-[2.5px]" />
                  </div>
                  <div>
                    <h4 className="font-black text-base uppercase text-black leading-snug">
                      +1,000 Quests
                    </h4>
                    <p className="text-[11px] font-black text-emerald-700 mt-1">
                      🏷️ Unlocks &quot;Potion Novice&quot; Badge
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleBuyPotion('minor_vial', 'Minor Mana Vial', 1000, '$5.00')}
                  disabled={selectedItem === 'minor_vial'}
                  className="mt-3 w-full bg-[#FFE600] hover:bg-yellow-300 font-black text-xs uppercase py-2.5 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {purchasedId === 'minor_vial' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3px]" /> REFILLED!
                    </>
                  ) : selectedItem === 'minor_vial' ? (
                    <Zap className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <>[BUY 1,000 QUESTS - $5.00]</>
                  )}
                </motion.button>
              </motion.div>

              {/* Potion 2: Greater Mana Elixir */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-amber-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase bg-[#A855F7] text-white px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                    [POTION #2] 🏺 GREATER ELIXIR
                  </span>
                  <span className="text-lg font-black text-black font-mono">$10.00</span>
                </div>

                <div className="flex items-start gap-3 my-2">
                  <div className="w-12 h-12 bg-purple-100 border-2 border-black flex-shrink-0 flex items-center justify-center shadow-[2px_2px_0_0_#000]">
                    <Sparkles className="w-6 h-6 text-[#A855F7] stroke-[2.5px]" />
                  </div>
                  <div>
                    <h4 className="font-black text-base uppercase text-black leading-snug">
                      +2,500 Quests
                    </h4>
                    <p className="text-[11px] font-black text-purple-700 mt-1">
                      🎁 1x Mystery Loot Box Drop
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleBuyPotion('greater_elixir', 'Greater Mana Elixir', 2500, '$10.00')}
                  disabled={selectedItem === 'greater_elixir'}
                  className="mt-3 w-full bg-[#FFE600] hover:bg-yellow-300 font-black text-xs uppercase py-2.5 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {purchasedId === 'greater_elixir' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3px]" /> REFILLED!
                    </>
                  ) : selectedItem === 'greater_elixir' ? (
                    <Zap className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <>[BUY 2,500 QUESTS - $10.00]</>
                  )}
                </motion.button>
              </motion.div>

              {/* Potion 3: Dragon's Mana Cauldron */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-orange-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase bg-[#FF5722] text-white px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                    [POTION #3] 🐉 DRAGON CAULDRON
                  </span>
                  <span className="text-lg font-black text-black font-mono">$20.00</span>
                </div>

                <div className="flex items-start gap-3 my-2">
                  <div className="w-12 h-12 bg-orange-100 border-2 border-black flex-shrink-0 flex items-center justify-center shadow-[2px_2px_0_0_#000]">
                    <Flame className="w-6 h-6 text-[#FF5722] stroke-[2.5px]" />
                  </div>
                  <div>
                    <h4 className="font-black text-base uppercase text-black leading-snug">
                      +6,000 Quests
                    </h4>
                    <p className="text-[11px] font-black text-orange-700 mt-1">
                      🐉 &quot;Gold Dragon Aura&quot; +2,000 XP
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleBuyPotion('dragon_cauldron', "Dragon's Mana Cauldron", 6000, '$20.00')}
                  disabled={selectedItem === 'dragon_cauldron'}
                  className="mt-3 w-full bg-[#FFE600] hover:bg-yellow-300 font-black text-xs uppercase py-2.5 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {purchasedId === 'dragon_cauldron' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3px]" /> REFILLED!
                    </>
                  ) : selectedItem === 'dragon_cauldron' ? (
                    <Zap className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <>[BUY 6,000 QUESTS - $20.00]</>
                  )}
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* 🔑 SECTION 2: VAULT PERKS & BANDWIDTH */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b-3 border-black pb-1.5">
              <KeyRound className="w-5 h-5 text-[#F59E0B] stroke-[3px]" />
              <h3 className="font-black text-base uppercase text-black">
                2. Rune Vault Perks & Bandwidth Upgrades
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vault Perk 1: Extra Rune Slot */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-white border-3 border-black p-5 shadow-[4px_4px_0_0_#000] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2.5 py-1 border border-black shadow-[2px_2px_0_0_#000]">
                      [VAULT PERK #1] 🔓 EXTRA RUNE SLOT
                    </span>
                    <span className="text-sm font-black text-black font-mono">+$10/mo</span>
                  </div>
                  <h4 className="font-black text-base uppercase text-black mt-2">
                    +1 Active API Key Slot ({1 + extraSlots} Current Max)
                  </h4>
                  <p className="text-xs font-bold text-zinc-600 mt-1">
                    Isolate bearer keys for <code className="bg-zinc-200 px-1 py-0.5 border border-zinc-400">Staging</code>, <code className="bg-zinc-200 px-1 py-0.5 border border-zinc-400">Production</code>, <code className="bg-zinc-200 px-1 py-0.5 border border-zinc-400">Discord_Bot</code>, and <code className="bg-zinc-200 px-1 py-0.5 border border-zinc-400">CRM_Sync</code>.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleBuyVaultPerk('extra_slot', 'Extra Rune Slot', 'slot')}
                  disabled={selectedItem === 'extra_slot'}
                  className="mt-4 w-full bg-black text-white hover:bg-zinc-800 font-black text-xs uppercase py-3 border-2 border-black shadow-[3px_3px_0_0_#FFE600] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {purchasedId === 'extra_slot' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#FFE600] stroke-[3px]" /> SLOT ADDED!
                    </>
                  ) : selectedItem === 'extra_slot' ? (
                    <Zap className="w-4 h-4 animate-spin text-[#FFE600]" />
                  ) : (
                    <>[ADD RUNE SLOT - $10/MO]</>
                  )}
                </motion.button>
              </motion.div>

              {/* Vault Perk 2: High Rate Limits */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-white border-3 border-black p-5 shadow-[4px_4px_0_0_#000] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase bg-[#8B5CF6] text-white px-2.5 py-1 border border-black shadow-[2px_2px_0_0_#000]">
                      [VAULT PERK #2] ⚡ HIGH RATE LIMITS
                    </span>
                    <span className="text-sm font-black text-black font-mono">+$49/mo</span>
                  </div>
                  <h4 className="font-black text-base uppercase text-black mt-2">
                    Arcane Speed Scroll ({hasArcaneSpeed ? '100 req/sec ACTIVE' : '10 req/min Standard'})
                  </h4>
                  <p className="text-xs font-bold text-zinc-600 mt-1">
                    Boost execution speed up to <span className="text-purple-700 font-black">100 req/sec</span> with high-throughput WebSockets and AI strikes.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleBuyVaultPerk('high_rate_limits', 'High Rate Limits', 'speed')}
                  disabled={selectedItem === 'high_rate_limits' || hasArcaneSpeed}
                  className={`mt-4 w-full font-black text-xs uppercase py-3 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer ${
                    hasArcaneSpeed
                      ? 'bg-purple-100 text-purple-900 border-purple-800 cursor-default'
                      : 'bg-black text-white hover:bg-zinc-800 shadow-[3px_3px_0_0_#8B5CF6]'
                  }`}
                >
                  {hasArcaneSpeed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-purple-700 stroke-[3px]" /> 100 REQ/SEC UNLOCKED
                    </>
                  ) : purchasedId === 'high_rate_limits' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[3px]" /> SPEED BOOSTED!
                    </>
                  ) : selectedItem === 'high_rate_limits' ? (
                    <Zap className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>[UNLOCK ARCANE SPEED - $49/MO]</>
                  )}
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* 🛠️ DEVELOPER EXPERIENCE (DX) TOOLBAR */}
          <div className="bg-zinc-100 border-3 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
            <div>
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-black stroke-[3px] ${autoRefill ? 'animate-spin' : ''}`} />
                <span className="font-black text-xs uppercase text-black">
                  AUTOMATED PRODUCTION BOT REFILL CONTROL
                </span>
              </div>
              <p className="text-[11px] font-bold text-zinc-600 mt-0.5">
                Automatically buys Minor Vial when Mana drops below 10% so external bots never crash.
              </p>
            </div>

            <button
              onClick={toggleAutoRefill}
              className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer transition-all flex items-center gap-2 ${
                autoRefill
                  ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                  : 'bg-zinc-300 text-zinc-800 hover:bg-zinc-400'
              }`}
            >
              <span>{autoRefill ? '🔄 AUTO-REFILL MANA AT < 10% [ACTIVE]' : '⏸️ AUTO-REFILL [OFF]'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

