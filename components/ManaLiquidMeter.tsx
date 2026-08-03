'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, AlertTriangle, Plus } from 'lucide-react'
import { sfx } from '@/lib/sfx'

interface ManaLiquidMeterProps {
  currentMana: number
  maxMana?: number
  onOpenShop: () => void
}

export default function ManaLiquidMeter({
  currentMana,
  maxMana = 100,
  onOpenShop,
}: ManaLiquidMeterProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((currentMana / maxMana) * 100)))
  const isCritical = percentage < 10

  // Particle sparks for critical state
  const [sparks, setSparks] = useState<{ id: number; x: number; delay: number }[]>([])

  useEffect(() => {
    if (!isCritical) return
    sfx.playCriticalWarning()
    const interval = setInterval(() => {
      setSparks((prev) => [
        ...prev.slice(-12),
        { id: Date.now() + Math.random(), x: Math.random() * 100, delay: Math.random() * 0.2 },
      ])
    }, 300)
    return () => clearInterval(interval)
  }, [isCritical])

  const handleRefillClick = () => {
    sfx.playElixirDrink()
    onOpenShop()
  }

  return (
    <div
      className={`relative overflow-hidden border-4 border-black p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-colors duration-500 ${
        isCritical
          ? 'bg-red-950 border-red-500 text-white animate-pulse'
          : 'bg-black text-white'
      }`}
    >
      {/* Critical Banner Overlay */}
      {isCritical && (
        <div className="absolute top-0 left-0 right-0 bg-[#FF0055] text-white font-black text-[11px] uppercase tracking-widest text-center py-0.5 z-20 flex items-center justify-center gap-2 border-b-2 border-black animate-bounce">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>CRITICAL MANA - REFILL NEEDED!</span>
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Left Info */}
      <div className={`flex items-center gap-3 relative z-10 ${isCritical ? 'mt-4 md:mt-0' : ''}`}>
        <div
          className={`p-2.5 border-2 border-black shadow-[2px_2px_0_0_#fff] ${
            isCritical ? 'bg-[#FF0055] text-white' : 'bg-[#06B6D4] text-black'
          }`}
        >
          <FlaskConical className="w-6 h-6 stroke-[3px]" />
        </div>
        <div>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-zinc-400">
            <span>Mana Tank</span>
            {isCritical && (
              <span className="bg-[#FF0055] text-white text-[10px] px-1.5 py-0.2 border border-white font-mono animate-ping">
                CRITICAL
              </span>
            )}
          </div>
          <div className="font-black text-2xl tracking-tight flex items-baseline gap-1">
            <span className={isCritical ? 'text-[#FF0055] drop-shadow-[0_0_8px_rgba(255,0,85,1)]' : 'text-[#38BDF8]'}>
              {currentMana}
            </span>
            <span className="text-sm text-zinc-400 font-mono">/ {maxMana} MP</span>
          </div>
        </div>
      </div>

      {/* SVG Liquid Container Bar */}
      <div className={`w-full md:w-72 relative z-10 ${isCritical ? 'mt-1' : ''}`}>
        <div className="relative h-9 w-full bg-zinc-900 border-4 border-white overflow-hidden shadow-[3px_3px_0_0_#000]">
          
          {/* Background Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:10px_10px] opacity-40 z-0 pointer-events-none" />

          {/* Liquid Wave Container */}
          <motion.div
            className="absolute top-0 bottom-0 left-0 overflow-hidden transition-all duration-700 ease-out"
            animate={{ width: `${percentage}%` }}
          >
            {/* SVG Wave Pattern */}
            <div className="relative w-full h-full">
              <svg
                className="absolute inset-0 w-[200%] h-full animate-[wave_2.5s_linear_infinite]"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,0 C150,90 350,-40 500,50 C650,140 900,-20 1200,40 L1200,120 L0,120 Z"
                  fill={isCritical ? '#FF0055' : '#06B6D4'}
                  opacity={0.6}
                />
                <path
                  d="M0,20 C200,-30 400,80 600,20 C800,-40 1000,70 1200,10 L1200,120 L0,120 Z"
                  fill={isCritical ? '#EF4444' : '#38BDF8'}
                />
              </svg>
            </div>
          </motion.div>

          {/* Spark Particles (for Critical State) */}
          <AnimatePresence>
            {isCritical &&
              sparks.map((spark) => (
                <motion.div
                  key={spark.id}
                  initial={{ opacity: 1, y: 30, scale: 0.8 }}
                  animate={{ opacity: 0, y: -20, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, delay: spark.delay }}
                  style={{ left: `${spark.x}%` }}
                  className="absolute bottom-0 w-2 h-2 bg-[#FFE600] rounded-full shadow-[0_0_6px_#FFE600] pointer-events-none z-20"
                />
              ))}
          </AnimatePresence>

          {/* Overlay Text inside bar */}
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase font-mono tracking-widest text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] z-10 pointer-events-none">
            {percentage}% CAPACITY
          </div>
        </div>
      </div>

      {/* Refill Button */}
      <div className="relative z-10 w-full md:w-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefillClick}
          className={`w-full md:w-auto font-black text-sm uppercase px-5 py-2.5 border-4 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            isCritical
              ? 'bg-[#FFE600] text-black hover:bg-yellow-300 animate-bounce'
              : 'bg-[#FFE600] text-black hover:bg-yellow-300'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[4px]" />
          <span>Refill 🧪</span>
        </motion.button>
      </div>
    </div>
  )
}
