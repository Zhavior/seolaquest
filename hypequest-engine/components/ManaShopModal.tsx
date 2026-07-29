'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FlaskConical, Sparkles, Flame, X, CheckCircle2, Zap } from 'lucide-react'

interface ManaShopModalProps {
  onClose: () => void
  onPurchaseSuccess?: (questsAdded: number) => void
}

const POTION_ITEMS = [
  {
    id: 'minor_vial',
    name: 'Minor Mana Vial',
    price: '$5.00',
    quests: '+1,000 Quests',
    badge: 'QUICK REFILL',
    accentColor: '#06B6D4',
    icon: FlaskConical,
    perk: 'Unlocks Potion Novice Badge',
  },
  {
    id: 'greater_elixir',
    name: 'Greater Mana Elixir',
    price: '$10.00',
    quests: '+2,500 Quests',
    badge: 'MOST POPULAR ✨',
    accentColor: '#A855F7',
    icon: Sparkles,
    perk: '1x Mystery Loot Drop',
  },
  {
    id: 'dragon_cauldron',
    name: "Dragon's Cauldron",
    price: '$20.00',
    quests: '+6,000 Quests',
    badge: 'BEST VALUE 👑',
    accentColor: '#F59E0B',
    icon: Flame,
    perk: 'Gold Dragon Aura + 2,000 Hero XP',
  },
]

import { createManaCheckoutAction } from '@/app/actions'

export default function ManaShopModal({ onClose, onPurchaseSuccess }: ManaShopModalProps) {
  const [selectedPotion, setSelectedPotion] = useState<string | null>(null)
  const [purchasedId, setPurchasedId] = useState<string | null>(null)

  const handleBuy = async (id: string, questsStr: string) => {
    setSelectedPotion(id)
    try {
      const res = await createManaCheckoutAction(id)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        alert(res.message || 'Failed to create checkout')
        setSelectedPotion(null)
      }
    } catch (e) {
      alert('Error creating checkout')
      setSelectedPotion(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, y: "-100vh", opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: "-100vh", opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        className="relative w-full max-w-2xl bg-[#F4F0EA] text-black border-4 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white hover:bg-black hover:text-white border-2 border-black p-1.5 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <X className="w-6 h-6 stroke-[3px]" />
        </button>

        <div className="bg-[#FFE600] border-3 border-black p-4 inline-block -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-black stroke-[2.5px] animate-bounce" />
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider">
              The Alchemist's Mana Shop
            </h2>
          </div>
          <p className="text-xs font-bold mt-1">Instant Quest refills to fuel your Hero Party!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          {POTION_ITEMS.map((item) => {
            const Icon = item.icon
            const isLoading = selectedPotion === item.id && !purchasedId
            const isDone = purchasedId === item.id

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className="relative bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group overflow-visible"
              >
                <div
                  className="text-[10px] font-black uppercase text-white px-2 py-0.5 border border-black inline-block self-start mb-3"
                  style={{ backgroundColor: item.accentColor }}
                >
                  {item.badge}
                </div>

                <div className="text-center my-2 relative">
                  <motion.div 
                    whileHover={{ rotate: 45, scale: 1.15 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                    className="w-16 h-16 mx-auto bg-slate-100 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-3"
                  >
                    <Icon className="w-10 h-10 stroke-[2.5px]" style={{ color: item.accentColor }} />
                  </motion.div>
                  <h3 className="font-black text-lg uppercase leading-tight">{item.name}</h3>
                  <div className="text-2xl font-black text-black mt-1">{item.quests}</div>
                  <div className="text-xs font-bold text-slate-600 mt-1">{item.perk}</div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBuy(item.id, item.quests)}
                  disabled={isLoading || isDone}
                  className="mt-4 w-full bg-[#FFE600] hover:bg-yellow-300 font-black text-sm uppercase py-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-700 stroke-[3px]" /> REFILLED!
                    </>
                  ) : isLoading ? (
                    <Zap className="w-5 h-5 animate-spin text-black" />
                  ) : (
                    <>[PURCHASE VIAL - {item.price}]</>
                  )}
                </motion.button>
              </motion.div>
            )
          })}
        </div>

        <p className="text-center text-xs font-bold text-slate-600 mt-4">
          ⚡ One-time charge. Quests never expire and stack directly onto your current balance.
        </p>
      </motion.div>
    </div>
  )
}
