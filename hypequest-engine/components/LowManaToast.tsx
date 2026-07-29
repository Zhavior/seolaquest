'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, X, ArrowRight } from 'lucide-react'

interface LowManaToastProps {
  remainingCredits?: number
  totalCredits?: number
  onOpenShop?: () => void
}

export default function LowManaToast({
  remainingCredits = 120,
  totalCredits = 1000,
  onOpenShop
}: LowManaToastProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const percentageLeft = Math.round((remainingCredits / totalCredits) * 100)
  const isLowMana = percentageLeft <= 15 && !isDismissed

  return (
    <AnimatePresence>
      {isLowMana && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          className="w-full max-w-[1400px] mx-auto relative z-20 mb-6 overflow-hidden"
        >
          <div className="bg-[#FFE600] text-black border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                animate={{ rotate: [-10, 10, -10], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="bg-[#EF4444] p-2.5 border-2 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0"
              >
                <FlaskConical className="w-6 h-6 stroke-[2.5px]" />
              </motion.div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-black text-white font-black text-[10px] uppercase px-2 py-0.5 border border-black">
                    CRITICAL MANA
                  </span>
                  <span className="font-black text-xs uppercase text-red-600 animate-pulse">
                    ({percentageLeft}% Left)
                  </span>
                </div>
                <h4 className="font-black text-base uppercase leading-tight mt-1 truncate">
                  Need More Potions! 🧪
                </h4>
                <p className="text-xs font-bold text-slate-800">
                  Only <span className="underline">{remainingCredits} quests</span> remaining. Refill to keep scrapers active!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenShop}
                className="bg-[#06B6D4] hover:bg-cyan-400 text-black font-black text-xs uppercase px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
              >
                Refill <ArrowRight className="w-4 h-4 stroke-[3px]" />
              </motion.button>

              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 bg-white text-black hover:bg-red-500 hover:text-white border-2 border-black transition-colors shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="Dismiss"
              >
                <X className="w-5 h-5 stroke-[3px]" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
