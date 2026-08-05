'use client'

import React, { useState, useMemo } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Search, Plus, Radio, Swords, Sparkles, X, ShieldAlert } from 'lucide-react'
import { addKeywordAction } from '@/features/dashboard/actions'
import {
  QuestBadge,
  QuestPageHeader,
  QuestPageShell,
  QuestPanel,
  QuestStatusPill,
  QuestTicker,
  questButton,
  questSurface,
} from '@/components/quest'

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
    <QuestPageShell watermark={<Swords className="h-[650px] w-[650px] text-black" />} gap="none">
      <motion.div
        variants={container}
        initial={shouldReduceMotion ? 'show' : 'hidden'}
        animate="show"
        className="space-y-8"
      >
        <motion.div variants={item}>
          <QuestTicker label="Quest log and keyword monitors. Live signal streams.">
            <Sparkles className="h-5 w-5 text-black" /> ⚔️ QUEST LOG &amp; KEYWORD MONITORS{' '}
            <Sparkles className="h-5 w-5 text-black" /> 🛡️ LIVE SIGNAL STREAMS
          </QuestTicker>
        </motion.div>

        <motion.div variants={item}>
          <QuestPageHeader
            className="mt-4"
            icon={<Swords className="h-8 w-8" />}
            eyebrow={<>COMMANDER&apos;S MAP &amp; SIGNAL TARGETS</>}
            title="Quest Log"
            subtitle="Active Keyword Monitors & Tracked Streams"
            status={<QuestStatusPill label="Signal streams" value={`${keywords.length} Active`} />}
          />
        </motion.div>

        {/* ARM NEW KEYWORD STREAM */}
        <motion.form
          variants={item}
          onSubmit={handleAddKeyword}
          aria-labelledby="arm-keyword-heading"
          className={questSurface({ className: 'space-y-6 p-6' })}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black pb-3">
            <h2
              id="arm-keyword-heading"
              className="flex items-center gap-2 text-xl font-black uppercase text-black"
            >
              <Plus aria-hidden="true" className="h-6 w-6 stroke-[3px] text-[#FF5722]" /> Arm New Keyword Stream
            </h2>
            <QuestBadge tone="gold">Monitor control</QuestBadge>
          </div>

          <div className="space-y-2">
            <label htmlFor="keyword-phrase" className="block text-xs font-black uppercase text-black/70">
              Target Buyer Phrase / Keyword
            </label>
            <input
              id="keyword-phrase"
              type="text"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              placeholder="e.g. need a crm tool, looking for hubspot alternative"
              className="w-full min-h-11 border-3 border-black bg-[#FFF8D9] p-3.5 text-sm font-black text-black shadow-[3px_3px_0_0_#000] placeholder:text-black/40 focus:bg-[#FFE600] focus:outline-none"
            />
          </div>

          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            type="submit"
            disabled={isAdding}
            className={questButton({ tone: 'lime', className: 'py-3.5 hover:bg-lime-400' })}
          >
            <Plus aria-hidden="true" className="h-5 w-5 stroke-[3px]" />{' '}
            {isAdding ? 'ARMING MONITOR...' : 'START MONITORING (+5 MP)'}
          </motion.button>
        </motion.form>

        {/* ACTIVE KEYWORD STREAMS */}
        <motion.section variants={item} aria-labelledby="active-streams-heading" className="space-y-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2
              id="active-streams-heading"
              className="inline-block -rotate-1 border-2 border-black bg-black px-4 py-1.5 text-2xl font-black uppercase text-white"
            >
              Active Keyword Streams ({filteredKeywords.length})
            </h2>

            {/* Instant Search Bar */}
            <div className={questSurface({ shadow: 'md', className: 'relative flex min-w-0 items-center sm:min-w-[260px]' })}>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 h-4 w-4 text-black/60" />
              <label htmlFor="keyword-search" className="sr-only">
                Search stream phrases
              </label>
              <input
                id="keyword-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH STREAM PHRASES..."
                className="min-h-11 w-full bg-transparent py-2.5 pl-9 pr-12 text-xs font-black uppercase text-black placeholder:text-black/40 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-0 flex h-11 w-11 items-center justify-center text-black/60 hover:text-black"
                  aria-label="Clear search"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {filteredKeywords.length === 0 ? (
            <QuestPanel padding="lg" className="text-center">
              <ShieldAlert aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-black" />
              <h3 className="text-xl font-black uppercase">No matching keyword streams</h3>
              <p className="mt-1 text-sm font-bold text-black/70">
                Arm a new phrase above to start tracking live buyer signals.
              </p>
            </QuestPanel>
          ) : (
            <ul className="grid grid-cols-1 gap-4">
              {filteredKeywords.map((kw) => (
                <QuestPanel
                  as="li"
                  key={kw.id}
                  interactive
                  padding="none"
                  className="flex flex-col items-start justify-between gap-4 p-5 md:flex-row md:items-center"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <QuestBadge tone="gold" className="tracking-normal">
                        {kw.heroClass}
                      </QuestBadge>
                      <QuestBadge tone="ink" shadow="none" border={2} className="tracking-normal">
                        {kw.platform}
                      </QuestBadge>
                    </div>
                    <h3 className="break-word-safe text-xl font-black uppercase text-black md:text-2xl">
                      &quot;{kw.phrase}&quot;
                    </h3>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-5">
                    <div
                      className={questSurface({
                        tone: 'sand',
                        border: 2,
                        shadow: 'xs',
                        className: 'px-3.5 py-2 text-right',
                      })}
                    >
                      <div className="text-[10px] font-black uppercase tracking-wider text-black/60">
                        Matches found
                      </div>
                      <div className="text-2xl font-black text-black">{kw.matchesFound}</div>
                    </div>

                    <QuestBadge
                      tone="mint"
                      className="tracking-normal px-3.5 py-2"
                      icon={<Radio aria-hidden="true" className="h-4 w-4 animate-pulse text-[#15803D] motion-reduce:animate-none" />}
                    >
                      Active Pulse
                    </QuestBadge>
                  </div>
                </QuestPanel>
              ))}
            </ul>
          )}
        </motion.section>
      </motion.div>
    </QuestPageShell>
  )
}
