'use client'

import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { sfx } from '@/lib/sfx'

export default function AudioNavbarToggle() {
  const [enabled, setEnabled] = useState(() => typeof window !== 'undefined' ? sfx.isEnabled() : true)

  const handleToggle = () => {
    const newState = sfx.toggle()
    setEnabled(newState)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className={`font-black text-xs md:text-sm uppercase px-3 py-2 border-2 border-black flex items-center gap-2 shadow-[2px_2px_0_0_#000] cursor-pointer transition-colors ${
        enabled
          ? 'bg-[#FFE600] text-black hover:bg-yellow-300'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      }`}
    >
      {enabled ? (
        <>
          <Volume2 className="w-4 h-4 text-black animate-pulse" />
          <span>🔊 SFX ON</span>
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 text-zinc-400" />
          <span>🔇 MUTE SFX</span>
        </>
      )}
    </motion.button>
  )
}
