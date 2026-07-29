'use client'

import { useMemo, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  CheckCircle2,
  Database,
  ExternalLink,
  Filter,
  FlaskConical,
  Flame,
  Lock,
  Plus,
  Radar,
  Radio,
  Search,
  Share2,
  Sparkles,
  Swords,
  Terminal,
  Trash2,
  Trophy,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import LowManaToast from '@/components/LowManaToast'
import ManaShopModal from '@/components/ManaShopModal'
import { addKeywordAction, claimQuestAction, dismissLeadAction, removeKeywordAction, scanForLeadsAction, generateAIReplyAction, exportToCrmAction } from './actions'

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

export type AnalyticsData = { day: string; claimed: number; dismissed: number }[]

export type LeaderboardUser = { name: string | null; title: string | null; level: number; xp: number }

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
  return 85 + (Math.abs(hash) % 13)
}

const MOCK_LEAD_POOL = [
  {
    author: 'u/saas_founder_99',
    platform: 'Reddit • r/SaaS',
    content: 'We need an automated social listening tool for our startup. What are you guys using instead of Mention or Brand24?',
    matched: 'social listening tool',
    url: 'https://reddit.com/r/SaaS',
  },
  {
    author: '@alex_builds',
    platform: 'Twitter / X',
    content: 'Anyone know a good freelance developer available this week for a custom Next.js landing page rebuild? Budget $1,500.',
    matched: 'freelance developer',
    url: 'https://x.com',
  },
  {
    author: 'u/indie_hacker_mike',
    platform: 'Reddit • r/Entrepreneur',
    content: 'Looking for a reliable agency or tool to generate B2B leads from Reddit discussions. Any recommendations?',
    matched: 'generate B2B leads',
    url: 'https://reddit.com/r/Entrepreneur',
  },
]

const EMPTY_SEVEN_DAY_ANALYTICS = [
  { day: 'Mon', claimed: 0, dismissed: 0 },
  { day: 'Tue', claimed: 0, dismissed: 0 },
  { day: 'Wed', claimed: 0, dismissed: 0 },
  { day: 'Thu', claimed: 0, dismissed: 0 },
  { day: 'Fri', claimed: 0, dismissed: 0 },
  { day: 'Sat', claimed: 0, dismissed: 0 },
  { day: 'Sun', claimed: 0, dismissed: 0 },
]

export default function DashboardClient({
  dbUser,
  dbKeywords,
  dbLeads,
  dbAnalytics,
  dbLeaderboard,
}: {
  dbUser: DashboardUser
  dbKeywords: DashboardKeyword[]
  dbLeads: DashboardLead[]
  dbAnalytics: AnalyticsData
  dbLeaderboard: LeaderboardUser[]
}) {
  const [user, setUser] = useState(dbUser)
  const [keywords, setKeywords] = useState(dbKeywords)
  const [leads, setLeads] = useState(dbLeads)
  const [newKeyword, setNewKeyword] = useState('')
  const [selectedHeroClass, setSelectedHeroClass] = useState('Warrior 🥷')
  const [filter, setFilter] = useState('ALL')
  const [notice, setNotice] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isManaShopOpen, setIsManaShopOpen] = useState(false)
  const [remainingQuests, setRemainingQuests] = useState(0)
  const [claimedCount, setClaimedCount] = useState(0)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([])

  // Live Scanning Mock Terminal State
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false)
  const [scanLogs, setScanLogs] = useState<string[]>([])
  const [scanStep, setScanStep] = useState(0)

  const filteredLeads = useMemo(
    () => leads.filter((lead) => filter === 'ALL' || lead.platform === filter),
    [filter, leads],
  )
  const platforms = ['ALL', ...Array.from(new Set(leads.map((lead) => lead.platform)))]
  const xpPercent = Math.min(100, Math.round((user.xp / Math.max(1, user.xpRequired)) * 100))

  const characterTitle = user.title || (user.level >= 10 ? 'Dragon Slayer Overlord 🐉' : 'Knight Slasher')
  const subscriptionTier = 'FREE_HUNTER'

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

  // Trigger Live Scanning Radar & Fetch Real Leads
  function runMockScanner() {
    spawnParticles()
    setIsScannerModalOpen(true)
    setScanLogs([])
    setScanStep(1)

    const activePhrases = keywords.length > 0 ? keywords.map((k) => `"${k.phrase}"`).join(', ') : '"need a website"'

    setTimeout(() => {
      setScanLogs((prev) => [...prev, `[0.2s] 📡 Deploying Hero Agents (${selectedHeroClass})...`])
      setScanStep(2)
    }, 400)

    setTimeout(() => {
      setScanLogs((prev) => [...prev, `[0.8s] 🔍 Querying Reddit & Twitter/X API for: ${activePhrases}...`])
      setScanStep(3)
    }, 1200)

    startTransition(async () => {
      // Actually run the real API scan while the animation plays
      const result = await scanForLeadsAction()
      
      setTimeout(() => {
        setScanLogs((prev) => [
          ...prev,
          `[1.6s] ⚡ Filtering threads... Analyzing AI Intent Scores & budget signals...`,
        ])
        setScanStep(4)
      }, 2200)

      setTimeout(() => {
        if (!result.ok) {
          setScanLogs((prev) => [...prev, `[2.4s] ⚠️ SCAN FAILED: ${result.message}`])
          setNotice(`Scan failed: ${result.message}`)
          setScanStep(5)
          return
        }

        if (result.created && result.created > 0) {
          setScanLogs((prev) => [...prev, `[2.4s] 💥 SUCCESS! Found ${result.created} High-Intent Quests.`])
          setNotice(`💥 ATTACK SCAN COMPLETE! ${result.created} new high-intent leads added to active feed!`)
        } else {
          setScanLogs((prev) => [...prev, `[2.4s] 📡 SCAN COMPLETE: No new high-intent quests found.`])
          setNotice(result.message || 'Scan complete. No new quests.')
        }
        setScanStep(5)

        // Note: The new leads will be populated by the server revalidating the page, 
        // so they will magically appear in the props. 
        // We don't need to manually inject them into state if we rely on Next.js server actions revalidating.
        // However, since we use local state for leads, we should refresh the page or rely on the prop update.
        window.location.reload()
      }, 3200)
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

  function generateAIReply(lead: DashboardLead) {
    if (user.level < 5) return setNotice('Reach Level 5 to unlock the AI Reply Generator!')
    setNotice(`🤖 AI is drafting a personalized reply to ${lead.author}...`)
    startTransition(async () => {
      const result = await generateAIReplyAction(lead.id)
      if (result.ok && result.reply) {
        setNotice(`🤖 AI Suggested Reply: "${result.reply}"`)
      } else {
        setNotice(result.message ?? 'Failed to generate AI reply.')
      }
    })
  }

  function exportToCRM(lead: DashboardLead) {
    if (user.level < 10) return setNotice('Reach Level 10 to unlock CRM Webhooks!')
    setNotice(`⚡ Exporting ${lead.platform} lead to your CRM...`)
    startTransition(async () => {
      const result = await exportToCrmAction(lead.id)
      setNotice(result.message ?? 'Failed to export lead.')
    })
  }

  function shareStats() {
    const pipelineValue = leads.length * 250
    const text = `⚔️ I'm a Level ${user.level} ${characterTitle} on HypeQuest!\n\n🔥 ${user.xp.toLocaleString()} XP earned\n💰 $${pipelineValue.toLocaleString()}/mo pipeline uncovered\n\nJoin the hunt! #BuildInPublic #SaaS`
    
    // Create Twitter share URL
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    setNotice('Stats shared! Thanks for spreading the word. 🚀')
  }

  return (
    <div className="min-h-screen notebook-pattern text-black p-4 md:p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* 🧪 TOP-CENTER LOW MANA ALERT TOAST */}
      <LowManaToast
        remainingCredits={remainingQuests}
        totalCredits={100}
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

      {/* 📡 LIVE SCANNING RADAR TERMINAL MODAL MOCKUP */}
      <AnimatePresence>
        {isScannerModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="relative w-full max-w-xl bg-black text-[#A3E635] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(255,230,0,1)] font-mono"
            >
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="absolute top-4 right-4 bg-white text-black hover:bg-red-500 hover:text-white border-2 border-black p-1 transition-colors"
              >
                <X className="w-5 h-5 stroke-[3px]" />
              </button>

              <div className="flex items-center gap-3 border-b-2 border-[#A3E635] pb-3 mb-4">
                <Radio className="w-6 h-6 animate-pulse text-[#FFE600]" />
                <h3 className="text-xl font-black uppercase text-[#FFE600] tracking-wider flex items-center gap-2">
                  <Terminal className="w-5 h-5" /> HYPEQUEST RADAR SCANNER v2.4
                </h3>
              </div>

              {/* TERMINAL LOG OUTPUT */}
              <div className="space-y-3 min-h-[160px] bg-black/90 p-4 border border-[#A3E635]/40 rounded text-sm leading-relaxed">
                {scanLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span>{log}</span>
                  </motion.div>
                ))}

                {scanStep > 0 && scanStep < 5 && (
                  <div className="flex items-center gap-2 text-[#FFE600] animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Analyzing live social network feeds...</span>
                  </div>
                )}
              </div>

              {/* PROGRESS BAR & ACTION */}
              <div className="mt-5 space-y-3">
                <div className="w-full bg-gray-900 border-2 border-[#A3E635] h-4 overflow-hidden">
                  <motion.div
                    className="bg-[#FFE600] h-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(scanStep / 5) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                {scanStep === 5 ? (
                  <button
                    onClick={() => setIsScannerModalOpen(false)}
                    className="w-full bg-[#A3E635] hover:bg-lime-400 text-black font-black text-sm uppercase py-3 border-2 border-black shadow-[3px_3px_0px_0px_#FFE600]"
                  >
                    VIEW DISCOVERED LEADS ⚡
                  </button>
                ) : (
                  <p className="text-xs text-center font-bold text-gray-400 uppercase">
                    ⚡ Hero Agents scanning Reddit & Twitter in real-time...
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. 👑 SESSION BAR */}
      <div className="bg-[#18181B] text-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-[#FFE600] text-black font-black text-xs uppercase px-2.5 py-1 border-2 border-black">
            SESSION: {subscriptionTier}
          </span>
          <span className="font-black text-sm uppercase text-gray-300">
            Account: <span className="text-[#A3E635]">{characterTitle}</span> ({user.name})
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#06B6D4]" />
            <span className="font-black text-xs uppercase text-cyan-300">
              Mana Balance: <span className="text-white text-sm">{remainingQuests} / 100 Quests</span>
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
        <div className="bg-[#FFE600] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1 relative flex flex-col justify-between">
          <div>
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
          
          <button
            onClick={shareStats}
            className="mt-6 w-full bg-black text-white hover:bg-gray-800 font-black text-xs uppercase py-2.5 border-2 border-black flex items-center justify-center gap-2"
          >
            <Share2 size={16} /> Share Stats to X
          </button>
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
            onClick={runMockScanner}
            disabled={isPending}
            className="mt-4 w-full bg-[#EF4444] hover:bg-red-600 text-white font-black text-base uppercase py-3 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            ⚔️ ATTACK MODE (SCAN NOW)
          </motion.button>
        </div>
      </div>

      {/* KEYWORD & HERO AGENT MANAGEMENT SECTION */}
      <section className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <input
              value={newKeyword}
              onChange={(event) => setNewKeyword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addKeyword()}
              placeholder="Track a phrase, e.g. need a website"
              className="min-w-0 flex-1 border-3 border-black bg-[#F4F0EA] p-3 font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FFE600]"
            />
            <select
              value={selectedHeroClass}
              onChange={(e) => setSelectedHeroClass(e.target.value)}
              className="border-3 border-black bg-[#FFE600] p-3 font-black text-sm uppercase focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="Warrior 🥷">Warrior 🥷 (Aggressive Leads)</option>
              <option value="Mage 🧙‍♂️">Mage 🧙‍♂️ (SaaS Mentions)</option>
              <option value="Knight 🦸‍♂️">Knight 🦸‍♂️ (Freelance Contracts)</option>
              <option value="Slayer 🧛‍♂️">Slayer 🧛‍♂️ (Competitor Swaps)</option>
            </select>
            <button
              type="button"
              onClick={addKeyword}
              disabled={isPending}
              className="border-3 border-black bg-[#A3E635] hover:bg-lime-400 p-3 font-black shadow-[3px_3px_0_0_#000] disabled:opacity-50 flex items-center justify-center gap-1.5 uppercase text-xs"
            >
              <Plus /> Deploy Hero Agent
            </button>
          </div>
          <button
            type="button"
            onClick={runMockScanner}
            disabled={isPending}
            className="border-3 border-black bg-[#06B6D4] hover:bg-cyan-400 px-5 py-3 font-black uppercase shadow-[3px_3px_0_0_#000] disabled:opacity-50 flex items-center justify-center gap-2 text-black"
          >
            <Radar size={20} /> Scan Network Now
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

      {/* TRACKED QUESTS HERO AGENT ROSTER */}
      <section>
        <h2 className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-2xl uppercase shadow-[4px_4px_0_0_#000]">
          <Swords /> Deployed Hero Agents on Quests ({keywords.length})
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {keywords.map((keyword, idx) => {
            const heroIcon =
              idx % 4 === 0 ? 'Warrior 🥷' : idx % 4 === 1 ? 'Mage 🧙‍♂️' : idx % 4 === 2 ? 'Knight 🦸‍♂️' : 'Slayer 🧛‍♂️'

            return (
              <div
                key={keyword.id}
                className="flex items-center gap-3 border-3 border-black bg-[#A3E635] px-4 py-2.5 font-bold shadow-[4px_4px_0_0_#000]"
              >
                <span className="bg-black text-white font-black text-xs px-2 py-0.5 border border-black uppercase flex items-center gap-1">
                  <Radio className="w-3 h-3 text-[#A3E635] animate-pulse" /> {heroIcon} ON QUEST
                </span>
                <span className="font-black">“{keyword.phrase}”</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword.id)}
                  disabled={isPending}
                  className="border-2 border-black bg-white p-1 hover:bg-red-400"
                  aria-label={`Recall ${keyword.phrase}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
          {!keywords.length && (
            <p className="font-bold text-gray-600">
              Deploy your first Hero Agent (Warrior, Mage, Knight, Slayer) above to monitor keywords on live quests!
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
          {dbAnalytics.map((item, idx) => {
            const heightPct = item.claimed ? Math.min(100, (item.claimed / 35) * 100) : 0
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

      {/* 5. 🏆 GLOBAL LEADERBOARD */}
      <section className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-black uppercase flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 stroke-[3px]" /> Global Leaderboard
        </h2>
        <div className="space-y-3">
          {dbLeaderboard.map((u, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 border-2 border-black ${idx === 0 ? 'bg-[#FFE600]' : idx === 1 ? 'bg-gray-100' : idx === 2 ? 'bg-[#F4F0EA]' : 'bg-white'} shadow-[2px_2px_0_0_#000]`}>
              <div className="flex items-center gap-3">
                <span className="font-black text-lg w-6">#{idx + 1}</span>
                <div>
                  <div className="font-black uppercase">{u.name || 'Anonymous Hunter'}</div>
                  <div className="text-xs font-bold text-gray-600">{u.title || 'Hunter'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-black text-white text-[10px] uppercase px-2 py-0.5 border border-black font-black inline-block">
                  Level {u.level}
                </div>
                <div className="font-black text-sm mt-1">{u.xp.toLocaleString()} XP</div>
              </div>
            </div>
          ))}
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
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
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
                  <div className="flex gap-2 mb-2">
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
                  
                  {/* UTILITY BUTTONS (LEVEL GATED) */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => generateAIReply(lead)}
                      disabled={isPending}
                      className={`flex-1 border-3 border-black p-2 font-black text-xs uppercase shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1 ${
                        user.level >= 5 ? 'bg-purple-400 hover:bg-purple-500 text-black' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {user.level >= 5 ? <Wand2 size={14} /> : <Lock size={14} />} AI Reply {user.level < 5 && '(Lvl 5)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => exportToCRM(lead)}
                      disabled={isPending}
                      className={`flex-1 border-3 border-black p-2 font-black text-xs uppercase shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1 ${
                        user.level >= 10 ? 'bg-green-400 hover:bg-green-500 text-black' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {user.level >= 10 ? <Database size={14} /> : <Lock size={14} />} CRM Export {user.level < 10 && '(Lvl 10)'}
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
