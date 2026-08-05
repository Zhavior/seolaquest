'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Radio } from 'lucide-react'
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

export function KeywordsClient({ initialKeywords }: KeywordsClientProps) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)
  const [newPhrase, setNewPhrase] = useState('')
  const [isAdding, setIsAdding] = useState(false)

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
      // In a real app we'd show a toast here
      console.error(result.message)
    }
    setIsAdding(false)
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="bg-[#FFE600] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1 inline-block">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider flex items-center gap-3">
          <Search className="w-8 h-8 stroke-[3px]" /> Keyword Monitors
        </h1>
        <p className="font-bold text-sm mt-1">Track target phrases across the sources currently connected to SEO la Quest.</p>
      </div>

      {/* ADD KEYWORD FORM */}
      <form onSubmit={handleAddKeyword} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <h2 className="text-xl font-black uppercase flex items-center gap-2">
          <Plus className="w-6 h-6 stroke-[3px]" /> Add Keyword Monitor
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {/* PHRASE INPUT */}
          <div>
            <label className="block text-xs font-black uppercase mb-2">Target Phrase / Keyword</label>
            <input
              type="text"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              placeholder="e.g. need a logo designer, Mention alternative"
              className="w-full bg-[#F4F0EA] border-3 border-black p-3 font-bold text-sm focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

        </div>

        {/* SUBMIT BUTTON */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isAdding}
          className="bg-[#A3E635] hover:bg-lime-400 font-black text-sm uppercase py-3 px-6 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-5 h-5 stroke-[2.5px]" /> {isAdding ? 'Adding...' : 'Start Monitoring'}
        </motion.button>
      </form>

      {/* ACTIVE KEYWORDS LIST */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black uppercase bg-black text-white px-3 py-1 inline-block">
          Active Keyword Streams ({keywords.length})
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {keywords.map((kw) => (
            <div
              key={kw.id}
              className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-[#FFE600] font-black text-xs px-2 py-0.5 border border-black">
                    {kw.heroClass}
                  </span>
                  <span className="bg-black text-white font-black text-xs uppercase px-2 py-0.5">
                    {kw.platform}
                  </span>
                </div>
                <h3 className="text-xl font-black text-black">&quot;{kw.phrase}&quot;</h3>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-black text-slate-500">MATCHES FOUND</div>
                  <div className="text-2xl font-black text-cyan-600">{kw.matchesFound}</div>
                </div>

                <span className="bg-green-200 text-green-900 border border-green-900 font-black text-xs px-3 py-1.5 flex items-center gap-1">
                  <Radio className="w-4 h-4 text-green-700" /> Enabled
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
