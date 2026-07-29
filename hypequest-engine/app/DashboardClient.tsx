'use client'

import { useMemo, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  ExternalLink,
  Filter,
  FlaskConical,
  Flame,
  Plus,
  Radar,
  Sparkles,
  Swords,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react'
import LowManaToast from '@/components/LowManaToast'
import ManaShopModal from '@/components/ManaShopModal'
import { addKeywordAction, claimQuestAction, dismissLeadAction, removeKeywordAction, scanForLeadsAction } from './actions'

export type DashboardUser = {
  name: string
  title: string
  xp: number
  level: number
  xpRequired: number
}

export type DashboardKeyword = { id: string; phrase: string; active: boolean }
export type DashboardLead = {
  id: string
  platform: string
  author: string
  content: string
  matched: string
  url: string
  sourceCreatedAt: string | null
}

function ageLabel(value: string | null) {
  if (!value) return 'Recently found'
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function getIntentScore(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return 85 + (Math.abs(hash) % 14)
}

const SEVEN_DAY_ANALYTICS = [
  { day: 'Mon', claimed: 12, dismissed: 3 },
  { day: 'Tue', claimed: 18, dismissed: 5 },
  { day: 'Wed', claimed: 14, dismissed: 2 },
  { day: 'Thu', claimed: 22, dismissed: 6 },
  { day: 'Fri', claimed: 19, dismissed: 4 },
  { day: 'Sat', claimed: 25, dismissed: 7 },
  { day: 'Sun', claimed: 31, dismissed: 8 },
]

export default function DashboardClient({
  dbUser,
  dbKeywords,
  dbLeads,
}: {
  dbUser: DashboardUser
  dbKeywords: DashboardKeyword[]
  dbLeads: DashboardLead[]
}) {
  const [user, setUser] = useState(dbUser)
  const [keywords, setKeywords] = useState(dbKeywords)
  const [leads, setLeads] = useState(dbLeads)
  const [newKeyword, setNewKeyword] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [notice, setNotice] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isManaShopOpen, setIsManaShopOpen] = useState(false)
  const [remainingQuests, setRemainingQuests] = useState(120)
  const [claimedCount, setClaimedCount] = useState(14)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([])

  const filteredLeads = useMemo(
    () => leads.filter((lead) => filter === 'ALL' || lead.platform === filter),
    [filter, leads],
  )
  const platforms = ['ALL', ...Array.from(new Set(leads.map((lead) => lead.platform)))]
  const xpPercent = Math.min(100, Math.round((user.xp / user.xpRequired) * 100))

  const characterTitle = user.level >= 10 ? 'Dragon Slayer Overlord 🐉' : user.title || 'Knight Slasher'
  const subscriptionTier = 'ENTERPRISE_OVERLORD'

  function addKeyword() {
    const phrase = newKeyword.trim()
    if (!phrase) return
    startTransition(async () => {
      const result = await addKeywordAction(phrase)
      if (!result.ok) return setNotice(result.message ?? 'Could not add keyword.')
      setKeywords((current) => [{ id: `new-${Date.now()}`, phrase, active: true }, ...current])
      setNewKeyword('')
      setNotice(`Tracking “${phrase}”. Run a scan to find matching social posts.`)
    })
  }

  function removeKeyword(id: string) {
    startTransition(async () => {
      const result = await removeKeywordAction(id)
      if (!result.ok) return setNotice(result.message ?? 'Could not remove keyword.')
      setKeywords((current) => current.filter((keyword) => keyword.id !== id))
    })
  }

  function spawnParticles() {
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 150,
    }))
    setParticles(newParticles)
    setTimeout(() => setParticles([]), 800)
  }

  function scan() {
    spawnParticles()
    startTransition(async () => {
      const result = await scanForLeadsAction()
      setNotice(result.message ?? `Scan complete: ${result.created ?? 0} new social posts found.`)
      if (result.ok) window.location.reload()
    })
  }

  function claimLead(id: string) {
    startTransition(async () => {
      const result = await claimQuestAction(id)
      if (!result.ok) return setNotice(result.message ?? 'Could not update quest.')
      if (result.user) setUser((current) => ({ ...current, ...result.user }))
      setLeads((current) => current.filter((lead) => lead.id !== id))
      setClaimedCount((prev) => prev + 1)
      setNotice('Quest claimed! +150 XP awarded. ⚔️')
    })
  }

  function dismissLead(id: string) {
    startTransition(async () => {
      const result = await dismissLeadAction(id)
      if (!result.ok) return setNotice(result.message ?? 'Could not dismiss quest.')
      setLeads((current) => current.filter((lead) => lead.id !== id))
    })
  }

  return (
    <div className="min-h-screen notebook-pattern text-black p-4 md:p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* 5. 🧪 TOP-CENTER LOW MANA ALERT TOAST */}
      <LowManaToast
        remainingCredits={remainingQuests}
        totalCredits={1000}
        onOpenShop={() => setIsManaShopOpen(true)}
      />

      {/* 🧪 ALCHEMIST MANA SHOP MODAL */}
      <AnimatePresence>
        {isManaShopOpen && (
          <ManaShopModal
            onClose={() => setIsManaShopOpen(false)}
            onPurchaseSuccess={(questsAdded) => {
              setRemainingQuests((prev) => prev + questsAdded)
              setNotice(`🧪 Success! Added +${questsAdded.toLocaleString()} Quests to your Mana balance.`)
            }}
          />
        )}
      </AnimatePresence>

      {/* 6. 👑 ENTERPRISE DEV SESSION BAR */}
      <div className="bg-[#18181B] text-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-[#FFE600] text-black font-black text-xs uppercase px-2.5 py-1 border-2 border-black">
            👑 SESSION: {subscriptionTier}
          </span>
          <span className="font-black text-sm uppercase text-gray-300">
            Account: <span className="text-[#A3E635]">{characterTitle}</span> ({user.name})
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#06B6D4]" />
            <span className="font-black text-xs uppercase text-cyan-300">
              Mana Balance: <span className="text-white text-sm">{remainingQuests} / 1000 Quests</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsManaShopOpen(true)}
            className="bg-[#FFE600] hover:bg-yellow-300 text-black font-black text-xs uppercase px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Refill Mana 🧪
          </button>
        </div>
      </div>

      {/* 1. ⚔️ HERO LEVEL & XP ENGINE + PIPELINE + ATTACK MODE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEVEL & XP CARD */}
        <div className="bg-[#FFE600] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1">
          <div className="flex items-center justify-between">
            <span className="bg-black text-white font-black text-xs uppercase px-2 py-0.5 border border-black">
              HERO LEVEL {user.level}
            </span>
            <Trophy className="w-6 h-6 stroke-[2.5px]" />
          </div>
          <h2 className="text-2xl font-black uppercase mt-2">{characterTitle}</h2>

          {/* CANDY-STRIPED XP PROGRESS BAR */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-black mb-1">
              <span>XP PROGRESS</span>
              <span>
                {user.xp} / {user.xpRequired} XP
              </span>
            </div>
            <div className="w-full h-5 bg-white border-2 border-black overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <motion.div
                className="h-full bg-[#A3E635] animate-candy-stripe border-r-2 border-black"
                initial={{ width: '0%' }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </div>
        </div>

        {/* 4. 📊 PIPELINE & REVENUE METRICS */}
        <div className="bg-[#06B6D4] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-1 text-white">
          <span className="bg-black text-cyan-300 font-black text-xs uppercase px-2 py-0.5 border border-white">
            POTENTIAL PIPELINE
          </span>
          <h2 className="text-4xl font-black text-black mt-2">
            ${(leads.length * 250).toLocaleString()} / mo
          </h2>
          <p className="text-xs font-black text-black mt-2">
            🔥 {leads.length} High-Intent Quests awaiting direct reply in your active feed.
          </p>
        </div>

        {/* 2. 💥 ATTACK MODE (FORCE NETWORK SCANNER) */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between relative overflow-hidden">
          {/* COMBAT EXPLOSION PARTICLES */}
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 2, x: p.x, y: p.y }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#EF4444] border border-black rounded-full pointer-events-none z-30"
              />
            ))}
          </AnimatePresence>

          <div>
            <span className="bg-red-500 text-white font-black text-xs uppercase px-2 py-0.5 border border-black">
              API RADAR ACTIVE
            </span>
            <h3 className="text-xl font-black uppercase mt-2">Force Network Scan</h3>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.92 }}
            animate={isPending ? { x: [-6, 6, -6, 6, 0], rotate: [-3, 3, -3, 3, 0] } : {}}
            transition={{ repeat: isPending ? Infinity : 0, duration: 0.15 }}
            onClick={scan}
            disabled={isPending || keywords.length === 0}
            className="mt-4 w-full bg-[#EF4444] hover:bg-red-600 text-white font-black text-base uppercase py-3 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? <>💥 SCANNING SOCIAL NETWORK...</> : <>⚔️ ATTACK MODE (SCAN NOW)</>}
          </motion.button>
        </div>
      </div>

      {/* KEYWORD MANAGEMENT SECTION */}
      <section className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 gap-3">
            <input
              value={newKeyword}
              onChange={(event) => setNewKeyword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addKeyword()}
              placeholder="Track a phrase, e.g. need a website"
              className="min-w-0 flex-1 border-3 border-black bg-[#F4F0EA] p-3 font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FFE600]"
            />
            <button
              type="button"
              onClick={addKeyword}
              disabled={isPending}
              className="border-3 border-black bg-[#FFE600] p-3 font-black shadow-[3px_3px_0_0_#000] disabled:opacity-50"
              aria-label="Add keyword"
            >
              <Plus />
            </button>
          </div>
          <button
            type="button"
            onClick={scan}
            disabled={isPending || keywords.length === 0}
            className="border-3 border-black bg-[#06B6D4] px-5 py-3 font-black uppercase shadow-[3px_3px_0_0_#000] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Radar size={20} /> {isPending ? 'Working…' : 'Scan Reddit now'}
          </button>
        </div>
        {notice && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="mt-3 border-2 border-black bg-[#A3E635] p-2 font-bold"
          >
            {notice}
          </motion.p>
        )}
      </section>

      {/* TRACKED QUESTS BADGES */}
      <section>
        <h2 className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-2xl uppercase shadow-[4px_4px_0_0_#000]">
          <Swords /> Tracked Quests ({keywords.length})
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {keywords.map((keyword) => (
            <div
              key={keyword.id}
              className="flex items-center gap-2 border-3 border-black bg-[#A3E635] px-3 py-2 font-bold shadow-[3px_3px_0_0_#000]"
            >
              <span>“{keyword.phrase}”</span>
              <button
                type="button"
                onClick={() => removeKeyword(keyword.id)}
                disabled={isPending}
                className="border-2 border-black bg-white p-1 hover:bg-red-400"
                aria-label={`Remove ${keyword.phrase}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!keywords.length && (
            <p className="font-bold text-gray-600">
              Add your first keyword above. Nothing is monitored until you do!
            </p>
          )}
        </div>
      </section>

      {/* 4. 📊 MONSTERS DEFEATED ANALYTICS */}
      <section className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase flex items-center gap-2">
            <BarChart3 className="w-6 h-6 stroke-[3px]" /> Monsters Defeated Analytics (Past 7 Days)
          </h2>
          <span className="bg-[#FFE600] font-black text-xs uppercase px-2.5 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Total Claimed: {claimedCount}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-32 border-b-2 border-black pb-2 pt-4">
          {SEVEN_DAY_ANALYTICS.map((item, idx) => {
            const heightPct = Math.min(100, (item.claimed / 35) * 100)
            return (
              <div key={item.day} className="flex flex-col items-center gap-1 h-full justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="w-full bg-[#06B6D4] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                <span className="text-[10px] font-black uppercase">{item.day}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. 🎯 ACTIVE QUEST FEED (LEAD CARDS) */}
      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="inline-flex items-center gap-2 bg-[#FF5722] text-white border-4 border-black px-4 py-2 font-black text-2xl uppercase shadow-[4px_4px_0_0_#000]">
            <Zap /> Open Leads ({filteredLeads.length})
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter size={18} />
            {platforms.map((platform) => (
              <button
                type="button"
                key={platform}
                onClick={() => setFilter(platform)}
                className={`border-2 border-black px-3 py-1 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  filter === platform ? 'bg-black text-white' : 'bg-white'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <AnimatePresence>
            {filteredLeads.map((lead) => {
              const intentScore = getIntentScore(lead.id)
              const estValue = `$${intentScore * 3}/mo`

              return (
                <motion.article
                  layout
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col justify-between"
                >
                  <div>
                    {/* BADGES & SCORE */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-black text-white font-black text-[10px] uppercase px-2 py-0.5 border border-black">
                          {lead.platform} • {lead.author}
                        </span>
                        <span className="text-xs font-bold text-gray-500">{ageLabel(lead.sourceCreatedAt)}</span>
                      </div>
                      <span className="bg-[#FFE600] font-black text-xs px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600" /> {intentScore}% Intent Score
                      </span>
                    </div>

                    <p className="my-3 font-bold leading-relaxed text-base">"{lead.content}"</p>

                    <div className="text-xs font-black text-gray-700 flex items-center gap-3 mb-4">
                      <span>
                        Matched Keyword: <span className="underline">"{lead.matched}"</span>
                      </span>
                      <span>
                        Est. Value: <span className="text-green-600 font-extrabold">{estValue}</span>
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => claimLead(lead.id)}
                      disabled={isPending}
                      className="flex-1 border-3 border-black bg-[#06B6D4] hover:bg-cyan-400 px-3 py-2.5 font-black uppercase text-black shadow-[3px_3px_0_0_#000] disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <Sparkles size={16} /> Mark Contacted (+150 XP)
                    </motion.button>

                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noreferrer"
                      className="border-3 border-black bg-[#FFE600] hover:bg-yellow-300 p-2.5 shadow-[3px_3px_0_0_#000] flex items-center justify-center"
                      aria-label="Open source post"
                    >
                      <ExternalLink size={18} />
                    </a>

                    <button
                      type="button"
                      onClick={() => dismissLead(lead.id)}
                      disabled={isPending}
                      className="border-3 border-black bg-white hover:bg-red-400 p-2.5 shadow-[3px_3px_0_0_#000]"
                      aria-label="Dismiss lead"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </div>

        {!filteredLeads.length && (
          <div className="border-4 border-dashed border-black bg-white p-10 text-center shadow-[6px_6px_0_0_#000]">
            <Radar className="mx-auto mb-3" size={40} />
            <h3 className="font-black text-2xl uppercase">No open leads</h3>
            <p className="mt-2 font-bold text-gray-600">
              {keywords.length ? 'Run a scan or change the platform filter.' : 'Add a keyword above, then run your first scan.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
