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
          initial={{ y: -120, x: "-50%", opacity: 0, scale: 0.8 }}
          animate={{ y: 0, x: "-50%", opacity: 1, scale: 1 }}
          exit={{ y: -120, x: "-50%", opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 450, damping: 20 }}
          className="fixed top-6 left-1/2 z-50 w-[92%] max-w-lg"
        >
          <div className="relative bg-[#FFE600] text-black border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [-10, 10, -10], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="bg-[#EF4444] p-2.5 border-2 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0"
              >
                <FlaskConical className="w-6 h-6 stroke-[2.5px]" />
              </motion.div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-black text-white font-black text-[10px] uppercase px-1.5 py-0.5 border border-black">
                    CRITICAL MANA
                  </span>
                  <span className="font-black text-xs uppercase text-red-600 animate-pulse">
                    ({percentageLeft}% Left)
                  </span>
                </div>
                <h4 className="font-black text-base uppercase leading-tight mt-0.5">
                  Need More Potions! 🧪
                </h4>
                <p className="text-xs font-bold text-slate-800">
                  Only <span className="underline">{remainingCredits} quests</span> remaining. Refill to keep scrapers active!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenShop}
                className="bg-[#06B6D4] hover:bg-cyan-400 text-black font-black text-xs uppercase px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
              >
                Refill <ArrowRight className="w-4 h-4 stroke-[3px]" />
              </motion.button>

              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 hover:bg-black/10 border-2 border-transparent hover:border-black transition-all"
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
