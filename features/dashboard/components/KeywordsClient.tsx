'use client'

import React, { useState, useMemo } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Search, Plus, Radio, Swords, Sparkles, X, ShieldAlert } from 'lucide-react'
import { addKeywordAction } from '@/features/dashboard/actions'

export interface Keyword {
  id: string
  phrase: string
  active?: boolean
  heroClass: string
  platform: string
  status: string
  matchesFound: number
}

interface KeywordsClientProps {
  initialKeywords: Keyword[]
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 22 } },
}

export function KeywordsClient({ initialKeywords }: KeywordsClientProps) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)
  const [newPhrase, setNewPhrase] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    const phrase = newPhrase.trim()
    if (!phrase) return

    setIsAdding(true)
    const result = await addKeywordAction(phrase)
    if (result.ok && result.keyword) {
      setKeywords((prev) => [result.keyword!, ...prev.filter((kw) => kw.id !== result.keyword!.id)])
      setNewPhrase('')
    } else {
      console.error(result.message)
    }
    setIsAdding(false)
  }

  const filteredKeywords = useMemo(() => {
    if (!searchQuery.trim()) return keywords
    const q = searchQuery.toLowerCase()
    return keywords.filter(
      (kw) =>
        kw.phrase.toLowerCase().includes(q) ||
        kw.heroClass.toLowerCase().includes(q) ||
        kw.platform.toLowerCase().includes(q)
    )
  }, [keywords, searchQuery])

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#FDFBF7] select-none">
      {/* Authentic Parchment / Commander's Map Paper Overlay (1:1 with Guild Hall) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      <div className="relative z-10 mx-auto min-h-[100dvh] w-full max-w-[1400px] p-4 font-black md:p-8">
        {/* Background Emblem Watermark */}
        <div className="hidden md:block absolute top-0 right-0 -mr-24 -mt-24 opacity-[0.05] pointer-events-none">
          <Swords className="w-[650px] h-[650px] text-black" />
        </div>

        <motion.div
          variants={container}
          initial={shouldReduceMotion ? 'show' : 'hidden'}
          animate="show"
          className="space-y-8 relative z-10"
        >
          {/* Neo-Brutalist Ticker Banner (1:1 with Guild Hall) */}
          <motion.div variants={item} className="w-full overflow-hidden border-4 border-black bg-[#FFE600] py-2 flex whitespace-nowrap shadow-[4px_4px_0_0_#000]">
            <motion.div 
              animate={{ x: [0, -1000] }} 
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="flex gap-10 text-lg md:text-xl uppercase tracking-widest font-black"
            >
              {[...Array(10)].map((_, i) => (
                <span key={i} className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-black" /> ⚔️ QUEST LOG & KEYWORD MONITORS <Sparkles className="w-5 h-5 text-black" /> 🛡️ LIVE SIGNAL STREAMS
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Header (1:1 with Guild Hall) */}
          <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Swords className="w-8 h-8 text-[#FF5722]" />
                <span className="bg-black text-[#FFE600] uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-black -rotate-1">
                  COMMANDER&apos;S MAP & SIGNAL TARGETS
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl uppercase tracking-tight text-white drop-shadow-[6px_6px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '2px black' }}>
                Quest Log
              </h1>
              <p className="text-xl md:text-2xl mt-2 uppercase bg-black text-white inline-block px-4 py-1 -rotate-1 border-2 border-black">
                Active Keyword Monitors & Tracked Streams
              </p>
            </div>
            
            <div className="flex items-center gap-3 border-4 border-black bg-white px-5 py-3 shadow-[6px_6px_0_0_#000]">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold">SIGNAL STREAMS</span>
                <span className="text-lg uppercase font-black leading-none text-black">{keywords.length} ACTIVE</span>
              </div>
            </div>
          </motion.div>

          {/* ADD KEYWORD FORM */}
          <motion.form variants={item} onSubmit={handleAddKeyword} className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000] space-y-6">
            <div className="flex items-center justify-between border-b-4 border-black pb-3">
              <h2 className="text-xl font-black uppercase flex items-center gap-2 text-black">
                <Plus className="w-6 h-6 stroke-[3px] text-[#FF5722]" /> Arm New Keyword Stream
              </h2>
              <span className="border-2 border-black bg-[#FFE600] px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
                MONITOR CONTROL
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-black/70">Target Buyer Phrase / Keyword</label>
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="e.g. need a crm tool, looking for hubspot alternative"
                className="w-full bg-[#FFF8D9] border-3 border-black p-3.5 font-black text-sm text-black placeholder:text-black/40 focus:outline-none focus:bg-[#FFE600] shadow-[3px_3px_0_0_#000]"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isAdding}
              className="bg-[#A3E635] hover:bg-lime-400 font-black text-sm uppercase py-3.5 px-6 border-4 border-black shadow-[4px_4px_0_0_#000] flex items-center gap-2 disabled:opacity-50 transition-all text-black"
            >
              <Plus className="w-5 h-5 stroke-[3px]" /> {isAdding ? 'ARMING MONITOR...' : 'START MONITORING (+5 MP)'}
            </motion.button>
          </motion.form>

          {/* ACTIVE KEYWORDS LIST */}
          <motion.div variants={item} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-black uppercase bg-black text-white px-4 py-1.5 inline-block -rotate-1 border-2 border-black">
                Active Keyword Streams ({filteredKeywords.length})
              </h2>

              {/* Instant Search Bar */}
              <div className="relative flex items-center border-4 border-black bg-white shadow-[4px_4px_0_0_#000] min-w-[260px]">
                <Search className="absolute left-3 h-4 w-4 text-black/60 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH STREAM PHRASES..."
                  className="w-full bg-transparent py-2.5 pl-9 pr-9 text-xs font-black uppercase text-black placeholder:text-black/40 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-1 text-black/60 hover:text-black"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {filteredKeywords.length === 0 ? (
              <div className="border-4 border-black bg-white p-8 text-center shadow-[6px_6px_0_0_#000]">
                <ShieldAlert className="mx-auto h-8 w-8 text-black mb-3" />
                <h3 className="text-xl font-black uppercase">No matching keyword streams</h3>
                <p className="mt-1 text-sm font-bold text-black/70">Arm a new phrase above to start tracking live buyer signals.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredKeywords.map((kw) => (
                  <div
                    key={kw.id}
                    className="group bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0_0_#000]"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-[#FFE600] font-black text-xs px-2.5 py-0.5 border-2 border-black shadow-[1.5px_1.5px_0_0_#000] text-black">
                          {kw.heroClass}
                        </span>
                        <span className="bg-black text-white font-black text-xs uppercase px-2.5 py-0.5 border border-black">
                          {kw.platform}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black uppercase text-black">&quot;{kw.phrase}&quot;</h3>
                    </div>

                    <div className="flex items-center gap-5 shrink-0">
                      <div className="border-2 border-black bg-[#FFF8D9] px-3.5 py-2 text-right shadow-[2px_2px_0_0_#000]">
                        <div className="text-[10px] font-black text-black/60 uppercase tracking-wider">MATCHES FOUND</div>
                        <div className="text-2xl font-black text-black">{kw.matchesFound}</div>
                      </div>

                      <span className="bg-[#D9FFE3] text-black border-2 border-black font-black text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-[2px_2px_0_0_#000]">
                        <Radio className="w-4 h-4 text-[#15803D] animate-pulse" /> Active Pulse
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
