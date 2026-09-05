'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Sparkles, Zap, Crown } from 'lucide-react'
import { sfx } from '@/lib/sfx'

interface HeroCrestProps {
  heroName: string
  heroTitle: string
  level: number
  isScanning?: boolean
  recentLevelUp?: boolean
}

export default function HeroCrest({
  heroName,
  heroTitle,
  level,
  isScanning = false,
  recentLevelUp = false,
}: HeroCrestProps) {
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false)

  useEffect(() => {
    if (recentLevelUp) {
      sfx.playLevelUp()
      const showTimer = setTimeout(() => setShowLevelUpEffect(true), 0)
      const hideTimer = setTimeout(() => setShowLevelUpEffect(false), 2500)
      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [recentLevelUp])

  return (
    <div className="relative flex items-center gap-4 bg-card border border-outline p-3.5 shadow-brutal-lg overflow-hidden group rounded-xl">
      
      {/* Background Sweeping Radar Grid (Active Scan State) */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 z-0 flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(#FFE600_1px,transparent_1px)] bg-[size:12px_12px] opacity-30" />
            <div className="w-48 h-48 rounded-full border border-[#FFE600]/40 animate-[ping_1.5s_infinite]" />
            <div className="absolute w-full h-full bg-[conic-gradient(from_0deg,#FFE600_0deg,transparent_60deg)] animate-[spin_2s_linear_infinite] opacity-30" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Sprite Avatar Badge */}
      <div className="relative z-10">
        {/* Breathing / Glowing Frame */}
        <motion.div
          animate={
            isScanning
              ? { scale: [1, 1.08, 1], boxShadow: ['0 0 10px #FFE600', '0 0 25px #FFE600', '0 0 10px #FFE600'] }
              : { scale: [1, 1.03, 1], y: [0, -2, 0] }
          }
          transition={{
            duration: isScanning ? 0.8 : 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border border-outline font-semibold text-2xl shadow-brutal-sm transition-colors  rounded-xl ${
            isScanning
              ? 'bg-accent text-on-accent border-[#FFE600]'
              : 'bg-forest text-ink-muted border-outline'
          }`}
        >
          {/* Avatar Icon */}
          <div className="relative flex items-center justify-center">
            <Shield className="w-8 h-8 stroke-[3px]" />
            
            {/* Glowing Eyes micro-animation */}
            <div className="absolute top-2 flex gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isScanning
                    ? 'bg-accent shadow-brutal animate-ping'
                    : 'bg-success shadow-brutal'
                }`}
              />
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isScanning
                    ? 'bg-accent shadow-brutal animate-ping'
                    : 'bg-success shadow-brutal'
                }`}
              />
            </div>
          </div>

          {/* Radar Scanner Badge Overlay */}
          {isScanning && (
            <div className="absolute -top-2 -right-2 bg-red-600 text-white font-mono text-[9px] font-semibold px-1.5 py-0.5 border border-white normal-case animate-pulse rounded-xl">
              SCAN
            </div>
          )}
        </motion.div>
      </div>

      {/* Hero Identity Text */}
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="bg-forest text-accent text-xs font-semibold normal-case px-2 py-0.5 border border-white font-mono rotate-0 rounded-xl">
            LVL {level}
          </span>
          {isScanning && (
            <span className="text-accent text-[10px] font-semibold normal-case tracking-wider animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" /> Scanning Grid...
            </span>
          )}
        </div>
        <p className="font-semibold text-lg md:text-xl normal-case tracking-tight truncate text-ink mt-0.5">
          {heroName}
        </p>
        <p className="font-bold text-xs normal-case tracking-wide text-ink-muted truncate">
          {heroTitle}
        </p>
      </div>

      {/* 8-bit Level Up Flash Overlay */}
      <AnimatePresence>
        {showLevelUpEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1.1, y: -20 }}
            exit={{ opacity: 0, scale: 1.3, y: -40 }}
            transition={{ duration: 0.6 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-accent text-on-accent font-semibold text-xl normal-case px-4 py-2 border border-outline shadow-brutal-lg rotate-3 flex items-center gap-2 pointer-events-none rounded-xl"
          >
            <Zap className="w-6 h-6 fill-black animate-spin" />
            <span>+150 XP! LEVEL UP!</span>
            <Crown className="w-6 h-6 text-ink" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
