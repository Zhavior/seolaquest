'use client'

import { useState } from 'react'
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-4 border-outline bg-accent p-4 shadow-brutal-lg">
        <div className="flex items-center gap-2 font-black uppercase text-sm text-on-accent">
          <Share2 size={18} strokeWidth={3} /> SHARE THIS GUILD QUEST:
        </div>

        <div className="flex items-center gap-2">
          {/* Share on X */}
          <button
            onMouseEnter={() => sfx.playHoverBlip()}
            onClick={handleShareX}
            className="flex items-center gap-1.5 border-3 border-outline bg-black px-4 py-2 text-xs font-black uppercase text-white shadow-brutal-sm hover:bg-[#8A2BE2] transition-colors hover:scale-105 active:scale-95"
          >
            <span>𝕏 Share on X</span>
          </button>

          {/* Copy Link */}
          <button
            onMouseEnter={() => sfx.playHoverBlip()}
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 border-3 border-outline bg-card px-4 py-2 text-xs font-black uppercase text-ink shadow-brutal-sm hover:bg-[#00FFFF] transition-colors hover:scale-105 active:scale-95"
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
          </button>
        </div>
      </div>

      {/* Floating High-Contrast Retro Toast Notification */}
      {toastMessage && (
          <div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 border-4 border-outline bg-success px-5 py-3 font-black uppercase text-on-accent text-xs shadow-brutal-lg animate-bounce"
          >
            <Sparkles size={16} className="text-on-accent" />
            {toastMessage}
          </div>
      )}
    </div>
  )
}
