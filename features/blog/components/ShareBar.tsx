'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Link as LinkIcon, Check, Sparkles } from 'lucide-react'
import { sfx } from '@/lib/sfx'

interface ShareBarProps {
  title: string
  url: string
}

export function ShareBar({ title, url }: ShareBarProps) {
  const [copied, setCopied] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleCopyLink = async () => {
    sfx.playCoinDrop()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      showToast('⚡ QUEST LINK COPIED TO CLIPBOARD!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('❌ FAILED TO COPY LINK')
    }
  }

  const handleShareX = () => {
    sfx.playCoinDrop()
    showToast('🚀 LAUNCHING TWEET TRANSMISSION...')
    const tweetText = `Just read "${title}" on @CoQuest! ⚔️\n\n${url}`
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
    window.open(xUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative">
      {/* High contrast Retro Share Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-4 border-black bg-[#FFE600] p-4 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center gap-2 font-black uppercase text-sm text-black">
          <Share2 size={18} strokeWidth={3} /> SHARE THIS GUILD QUEST:
        </div>

        <div className="flex items-center gap-2">
          {/* Share on X */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={() => sfx.playHoverBlip()}
            onClick={handleShareX}
            className="flex items-center gap-1.5 border-3 border-black bg-black px-4 py-2 text-xs font-black uppercase text-white shadow-[3px_3px_0_0_#000] hover:bg-[#8A2BE2] transition-colors"
          >
            <span>𝕏 Share on X</span>
          </motion.button>

          {/* Copy Link */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={() => sfx.playHoverBlip()}
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 border-3 border-black bg-white px-4 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_0_#000] hover:bg-[#00FFFF] transition-colors"
          >
            {copied ? (
              <>
                <Check size={14} strokeWidth={3} className="text-green-600" /> COPIED!
              </>
            ) : (
              <>
                <LinkIcon size={14} strokeWidth={3} /> COPY LINK
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Floating High-Contrast Retro Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 border-4 border-black bg-[#A3E635] px-5 py-3 font-black uppercase text-black text-xs shadow-[6px_6px_0_0_#000]"
          >
            <Sparkles size={16} className="text-black" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
