'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Swords, X, Sparkles, Send, Copy, Check } from 'lucide-react'
import { sfx } from '@/lib/sfx'
import type { DashboardLead } from '@/features/dashboard/types'

interface QuickStrikeReplyModalProps {
  lead: DashboardLead
  onClose: () => void
  onConfirmClaim: (leadId: string, replyText: string) => void
}

type Archetype = 'diplomat' | 'aggressive' | 'guildmate'

export default function QuickStrikeReplyModal({
  lead,
  onClose,
  onConfirmClaim,
}: QuickStrikeReplyModalProps) {
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('diplomat')
  const [editedReply, setEditedReply] = useState('')
  const [copied, setCopied] = useState(false)

  const isTwitter = lead.platform.toUpperCase().includes('TWITTER') || lead.platform.toUpperCase().includes('X')
  const authorHandle = isTwitter 
    ? (lead.author.startsWith('@') ? lead.author : `@${lead.author}`)
    : (lead.author.startsWith('u/') ? lead.author : `u/${lead.author}`)

  // AI Response Archetype Presets
  const presets: Record<Archetype, { title: string; icon: string; text: string }> = {
    diplomat: {
      title: 'The Diplomat 📜',
      icon: '📜',
      text: `Hey ${authorHandle}! We actually solved this exact problem for our SaaS workspace. Having automated lead detection & CRM sync completely transformed our acquisition flow. Would love to share our stack breakdown if you're interested!`,
    },
    aggressive: {
      title: 'The Aggressive Pitch ⚔️',
      icon: '⚔️',
      text: `Hey ${authorHandle}, stop wasting hours hunting leads manually. CoQuest automates social intent scraping 24/7 and delivers verified buyers straight to your pipeline. Check it out now to claim your first 100 free bounties!`,
    },
    guildmate: {
      title: 'The Helpful Guildmate 🛡️',
      icon: '🛡️',
      text: `Saw your post about "${lead.matched}". Total pain point! We spent weeks trying manual outreach until we built a custom scanner. If you're building a tool in this space, happy to bounce ideas or send over our setup guide!`,
    },
  }

  // Spacebar Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in textarea or input
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        sfx.playSwordSlash()
        onConfirmClaim(lead.id, editedReply)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editedReply, lead.id, onConfirmClaim])

  const handleFireReply = () => {
    sfx.playSwordSlash()
    onConfirmClaim(lead.id, editedReply)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editedReply)
    setCopied(true)
    sfx.playHoverBlip()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        className="relative w-full max-w-3xl bg-[#F4F0EA] border-8 border-black shadow-[16px_16px_0px_0px_rgba(255,230,0,1)] p-6 md:p-8 font-black text-black overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white hover:bg-red-500 hover:text-white border-4 border-black p-2 shadow-[4px_4px_0_0_#000] transition-colors"
        >
          <X className="w-6 h-6 stroke-[4px]" />
        </button>

        {/* 8-Bit Header */}
        <div className="flex items-center gap-3 bg-black text-white p-4 border-4 border-black mb-6 shadow-[4px_4px_0_0_#A3E635]">
          <Swords className="w-8 h-8 text-[#FFE600] animate-bounce" />
          <div>
            <h3 className="text-xl md:text-2xl font-black uppercase text-[#FFE600] tracking-wider">
              Quick-Strike Auto-Reply (1-Click Claim)
            </h3>
            <p className="text-xs text-zinc-300 font-mono">
              TARGET: <span className="text-[#A3E635]">u/{lead.author}</span> • PLATFORM:{' '}
              <span className="text-[#38BDF8]">{lead.platform}</span>
            </p>
          </div>
        </div>

        {/* Target Post Quote Box */}
        <div className="bg-white border-4 border-black p-4 mb-6 shadow-[4px_4px_0_0_#000]">
          <div className="flex justify-between items-center text-xs font-mono uppercase text-zinc-500 mb-2 border-b-2 border-zinc-200 pb-1">
            <span>Target Social Post Content</span>
            <span className="bg-[#FFE600] text-black px-2 py-0.5 font-black border border-black">
              MATCH: &quot;{lead.matched}&quot;
            </span>
          </div>
          <p className="font-bold text-sm md:text-base italic leading-relaxed text-zinc-800">
            &quot;{lead.content}&quot;
          </p>
        </div>

        {/* 3 AI Archetypes Tabs */}
        <div className="mb-4">
          <label className="block text-xs uppercase font-black tracking-wider text-zinc-600 mb-2">
            Select AI Response Archetype:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['diplomat', 'aggressive', 'guildmate'] as Archetype[]).map((arch) => (
              <button
                key={arch}
                onClick={() => {
                  setSelectedArchetype(arch)
                  setEditedReply(presets[arch].text)
                  sfx.playHoverBlip()
                }}
                className={`border-4 border-black p-3 font-black text-xs md:text-sm uppercase text-left transition-all shadow-[4px_4px_0_0_#000] active:translate-y-0.5 active:shadow-none flex items-center justify-between ${
                  selectedArchetype === arch
                    ? 'bg-[#FFE600] text-black ring-2 ring-black scale-105'
                    : 'bg-white text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span>{presets[arch].title}</span>
                {selectedArchetype === arch && <Sparkles className="w-4 h-4 text-black" />}
              </button>
            ))}
          </div>
        </div>

        {/* Editable Reply Box */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs uppercase font-black tracking-wider text-zinc-600">
              Drafted Response:
            </label>
            <button
              onClick={handleCopy}
              className="text-xs font-black uppercase text-zinc-700 hover:text-black flex items-center gap-1 bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0_0_#000]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'COPIED!' : 'COPY'}
            </button>
          </div>
          <textarea
            value={editedReply}
            onChange={(e) => setEditedReply(e.target.value)}
            rows={4}
            className="w-full border-4 border-black bg-white p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-4 focus:ring-[#06B6D4] shadow-[4px_4px_0_0_#000]"
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono font-bold text-zinc-500 uppercase flex items-center gap-2">
            <span className="bg-black text-[#FFE600] px-2 py-1 border border-black font-black">
              SPACEBAR
            </span>
            <span>PRESS SPACE TO STRIKE & CLAIM (+150 XP)</span>
          </div>

          <button
            onClick={handleFireReply}
            className="w-full sm:w-auto bg-[#A3E635] hover:bg-lime-400 text-black border-4 border-black px-8 py-4 font-black text-lg md:text-xl uppercase shadow-[6px_6px_0_0_#000] active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 cursor-pointer"
          >
            <Send className="w-6 h-6 stroke-[3px]" />
            <span>FIRE REPLY & CLAIM (+150 XP) ⚔️</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
