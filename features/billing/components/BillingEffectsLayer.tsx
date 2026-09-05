import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Sword, Flame, Sparkles, Sprout } from 'lucide-react'

type BillingEffectsLayerProps = {
  activeEffect: 'none' | 'peasant' | 'swordsman' | 'knight' | 'sorcerer' | 'dragon'
}

export function BillingEffectsLayer({ activeEffect }: BillingEffectsLayerProps) {
  return (
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
              className="flex flex-col items-center text-ink-muted"
            >
              <Sprout className="w-36 h-36 stroke-[3px]" />
              <div className="bg-zinc-300 text-ink font-semibold text-2xl p-4 border border-outline mt-4 shadow-brutal rounded-xl">
                🌱 PEASANT AWAKENED! (Time to work)
              </div>
            </motion.div>
          )}

          {activeEffect === 'swordsman' && (
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1.5, rotate: 45 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-ink-muted"
            >
              <Sword className="w-36 h-36 stroke-[3px]" />
              <div className="bg-success text-on-accent font-semibold text-2xl p-4 border border-outline mt-4 rounded-xl">
                🗡️ SWORDSMAN RECRUITED! (+1.5x XP Boost)
              </div>
            </motion.div>
          )}

          {activeEffect === 'knight' && (
            <div className="relative flex flex-col items-center justify-center gap-8">
              <div className="relative">
                <motion.div initial={{ scale: 3, y: -120 }} animate={{ scale: 1.2, y: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 15 }}>
                  <Shield className="w-48 h-48 text-ink-inverse fill-slate-700 stroke-[3px]" />
                </motion.div>
                <motion.div initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 45, opacity: 1 }} transition={{ delay: 0.3, duration: 0.3 }} className="absolute inset-0 flex items-center justify-center">
                  <Sword className="w-64 h-64 text-cyan-300 stroke-[3px]" />
                </motion.div>
              </div>
              <div className="bg-[#3B82F6] text-white font-semibold text-3xl p-6 border border-white shadow-brutal normal-case text-center max-w-lg leading-tight rounded-xl">
                Knight Contract Signed! <br/><span className="text-accent">Shield Equipped.</span>
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
              <Sparkles className="w-48 h-48 animate-pulse text-ink-muted" />
              <div className="bg-forest text-white font-semibold text-3xl p-6 border border-white shadow-brutal normal-case text-center max-w-lg leading-tight rounded-xl">
                Sorcerer Contract Signed! <br/><span className="text-accent">Arcane Nova Unleashed.</span>
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
                <span className="text-9xl font-semibold">🐉</span>
              </div>
              <div className="bg-danger text-white font-semibold text-3xl p-6 border border-white shadow-brutal normal-case text-center max-w-lg leading-tight rounded-xl">
                Dragon Overlord Summoned! <br/><span className="text-accent">Fire Breathed.</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
