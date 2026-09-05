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
          <div className="bg-accent text-on-accent border border-outline p-4 shadow-brutal-lg flex flex-wrap items-center justify-between gap-4 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                animate={{ rotate: [-10, 10, -10], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="bg-danger p-2.5 border border-outline text-white shadow-brutal-sm flex items-center justify-center shrink-0 rounded-xl"
              >
                <FlaskConical className="w-6 h-6 stroke-[2.5px]" />
              </motion.div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-forest text-white font-semibold text-[10px] normal-case px-2 py-0.5 border border-outline rounded-xl">
                    CRITICAL MANA
                  </span>
                  <span className="font-semibold text-xs normal-case text-red-600 animate-pulse">
                    ({percentageLeft}% Left)
                  </span>
                </div>
                <h4 className="font-semibold text-base normal-case leading-tight mt-1 truncate">
                  Need More Potions! 🧪
                </h4>
                <p className="text-xs font-bold text-ink">
                  Only <span className="underline">{remainingCredits} quests</span> remaining. Refill to keep scrapers active!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {onOpenShop && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenShop}
                  className="flex min-h-11 items-center gap-1.5 border border-outline bg-info px-4 py-2 text-xs font-semibold normal-case text-on-accent shadow-brutal-sm hover:bg-cyan-400 rounded-xl"
                >
                  Refill <ArrowRight className="w-4 h-4 stroke-[3px]" />
                </motion.button>
              )}

              <button
                onClick={() => setIsDismissed(true)}
                aria-label="Dismiss low mana warning"
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-outline bg-card text-ink shadow-brutal-sm transition-colors hover:bg-red-500 hover:text-white rounded-xl"
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
