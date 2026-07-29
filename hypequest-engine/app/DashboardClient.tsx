'use client'

import { useMemo, useState, useTransition } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
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
  Crown,
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
  const PRESET_KEYWORDS = ['looking for CRM', 'best SaaS for...', 'alternative to...']

  function addKeyword() {
    const phrase = newKeyword.trim()
    if (!phrase) return
    startTransition(async () => {
      const result = await addKeywordAction(phrase)
      if (!result.ok) return setNotice(result.message ?? 'Could not add keyword.')
      setKeywords((current) => [{ id: `new-${Date.now()}`, phrase, active: true }, ...current])
      setNewKeyword('')
      setNotice(`Tracking "${phrase}". Run a scan to find matching social posts.`)
    })
  }

  function handlePresetClick(phrase: string) {
    setNewKeyword(phrase)
    startTransition(async () => {
      const result = await addKeywordAction(phrase)
      if (!result.ok) return setNotice(result.message ?? 'Could not add keyword.')
      setKeywords((current) => [{ id: `new-${Date.now()}`, phrase, active: true }, ...current])
      setNewKeyword('')
      setNotice(`Tracking "${phrase}". Run a scan to find matching social posts.`)
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
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
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
      setScanLogs((prev) => [...prev, `[0.8s] 🔍 Querying APIs for: ${activePhrases}...`])
      setScanStep(3)
    }, 1200)

    startTransition(async () => {
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
          setNotice(`💥 ATTACK SCAN COMPLETE! ${result.created} new high-intent leads added!`)
        } else {
          setScanLogs((prev) => [...prev, `[2.4s] 📡 SCAN COMPLETE: No new high-intent quests found.`])
          setNotice(result.message || 'Scan complete. No new quests.')
        }
        setScanStep(5)
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
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    setNotice('Stats shared! Thanks for spreading the word. 🚀')
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black p-4 md:p-8 font-black overflow-hidden relative">
      <LowManaToast remainingCredits={remainingQuests} totalCredits={100} onOpenShop={() => setIsManaShopOpen(true)} />

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

      <AnimatePresence>
        {isScannerModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="relative w-full max-w-2xl bg-black text-[#A3E635] border-4 border-[#A3E635] p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(255,230,0,1)] font-mono"
            >
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="absolute top-4 right-4 bg-white text-black hover:bg-red-500 hover:text-white border-4 border-black p-2 transition-colors shadow-[4px_4px_0_0_#000]"
              >
                <X className="w-6 h-6 stroke-[4px]" />
              </button>

              <div className="flex items-center gap-4 border-b-4 border-[#A3E635] pb-4 mb-6">
                <Radio className="w-8 h-8 animate-pulse text-[#FFE600]" />
                <h3 className="text-2xl md:text-3xl font-black uppercase text-[#FFE600] tracking-widest">
                  HypeQuest Radar v2.4
                </h3>
              </div>

              <div className="space-y-4 min-h-[200px] bg-[#111] p-6 border-2 border-[#A3E635]/40 text-sm md:text-base leading-relaxed overflow-y-auto">
                {scanLogs.map((log, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                    <span>{log}</span>
                  </motion.div>
                ))}
                {scanStep > 0 && scanStep < 5 && (
                  <div className="flex items-center gap-2 text-[#FFE600] animate-pulse mt-4">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Analyzing live social network feeds...</span>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <div className="w-full bg-gray-900 border-4 border-[#A3E635] h-6 overflow-hidden">
                  <motion.div className="bg-[#FFE600] h-full" initial={{ width: '0%' }} animate={{ width: `${(scanStep / 5) * 100}%` }} transition={{ duration: 0.4 }} />
                </div>
                {scanStep === 5 ? (
                  <button onClick={() => setIsScannerModalOpen(false)} className="w-full bg-[#A3E635] hover:bg-lime-400 text-black font-black text-xl uppercase py-4 border-4 border-[#A3E635] shadow-[6px_6px_0px_0px_#FFE600]">
                    VIEW DISCOVERED LEADS ⚡
                  </button>
                ) : (
                  <p className="text-sm text-center font-bold text-[#A3E635] uppercase tracking-wider">
                    ⚡ Hero Agents scanning Reddit & Twitter in real-time...
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-8 relative z-10">
        
        {/* SESSION BAR */}
        <motion.div variants={item} className="bg-black text-white border-4 border-black p-4 flex flex-wrap items-center justify-between gap-4 shadow-[6px_6px_0px_0px_rgba(255,230,0,1)]">
          <div className="flex items-center gap-4">
            <span className="bg-[#FF5722] text-white font-black text-sm uppercase px-3 py-1 border-2 border-white shadow-[2px_2px_0_0_#fff]">
              {subscriptionTier}
            </span>
            <span className="font-black text-base uppercase">
              <span className="text-[#06B6D4]">{characterTitle}</span> ({user.name})
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 border-2 border-zinc-700">
              <FlaskConical className="w-5 h-5 text-[#A3E635]" />
              <span className="font-black text-sm uppercase text-white">
                Mana: <span className="text-[#A3E635]">{remainingQuests}</span>
              </span>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsManaShopOpen(true)} className="bg-[#FFE600] text-black font-black text-sm uppercase px-4 py-2 border-2 border-black shadow-[3px_3px_0_0_#000] animate-[pulse_2s_ease-in-out_infinite]">
              Refill 🧪
            </motion.button>
          </div>
        </motion.div>

        {notice && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#06B6D4] text-black font-black text-lg p-4 border-4 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice('')}><X className="w-6 h-6 stroke-[3px]" /></button>
          </motion.div>
        )}

        {/* TOP BENTO ROW */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* CHARACTER SHEET (Spans 8 cols) */}
          <motion.div variants={item} className="xl:col-span-8 bg-[#FFE600] border-4 border-black p-8 md:p-10 shadow-[8px_8px_0_0_#000] flex flex-col justify-between relative group overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-black text-[#FFE600] font-black text-xl uppercase px-4 py-2 border-2 border-white shadow-[4px_4px_0_0_#fff] -rotate-2">
                    Level {user.level}
                  </div>
                  <Trophy className="w-8 h-8 stroke-[3px]" />
                </div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-black" style={{ WebkitTextStroke: '1px white' }}>
                  {characterTitle}
                </h1>
                
                <div className="mt-8 bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                  <div className="flex justify-between font-black uppercase text-sm mb-2">
                    <span>XP Progress</span>
                    <span>{user.xp} / {user.xpRequired} XP</span>
                  </div>
                  <div className="w-full h-8 bg-[#F4F0EA] border-4 border-black overflow-hidden relative">
                    <motion.div className="h-full bg-[#A3E635] border-r-4 border-black" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)' }} initial={{ width: '0%' }} animate={{ width: `${xpPercent}%` }} transition={{ type: 'spring', stiffness: 100 }} />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="bg-[#06B6D4] border-4 border-black p-6 shadow-[4px_4px_0_0_#000] rotate-2">
                  <span className="bg-black text-[#06B6D4] font-black text-[10px] uppercase px-2 py-0.5 border border-white">PIPELINE VALUE</span>
                  <p className="text-3xl md:text-4xl font-black mt-2 text-white" style={{ WebkitTextStroke: '1px black' }}>${(leads.length * 250).toLocaleString()}/mo</p>
                  <p className="text-[11px] font-black text-black uppercase mt-2 border-t-2 border-black/20 pt-2 tracking-tight">Est. Bounty: $250 / lead</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={shareStats} className="bg-black text-white hover:bg-zinc-800 font-black text-lg uppercase py-4 border-4 border-white shadow-[4px_4px_0_0_#fff] flex items-center justify-center gap-3">
                  <Share2 size={20} /> Brag on X
                </motion.button>
              </div>
            </div>
            <Crown className="absolute -bottom-10 -left-10 w-64 h-64 text-black opacity-10 group-hover:scale-110 transition-transform duration-500" />
          </motion.div>

          {/* RADAR BUTTON (Spans 4 cols) */}
          <motion.div variants={item} className="xl:col-span-4 bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Particles */}
            <AnimatePresence>
              {particles.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }} animate={{ opacity: 0, scale: 3, x: p.x, y: p.y }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#EF4444] border-2 border-black rounded-full pointer-events-none z-30" />
              ))}
            </AnimatePresence>
            
            <div className={`uppercase text-xs md:text-sm font-black px-4 py-1.5 border-2 border-black mb-6 rotate-2 shadow-[2px_2px_0_0_#000] text-center ${
              keywords.length > 0
                ? 'bg-[#EF4444] text-white'
                : 'bg-zinc-200 text-zinc-800'
            }`}>
              {keywords.length > 0
                ? `SCANNER ARRAY READY (${keywords.length} AGENT${keywords.length > 1 ? 'S' : ''} ACTIVE)`
                : 'SCANNER STANDBY (0 AGENTS ACTIVE)'}
            </div>
            
            <div className="relative flex items-center justify-center w-full max-w-[240px] aspect-square">
              {keywords.length > 0 && (
                <>
                  <div className="absolute inset-0 rounded-full bg-[#EF4444]/30 animate-ping pointer-events-none z-0" />
                  <div className="absolute -inset-4 rounded-full border-4 border-dashed border-[#EF4444] animate-[spin_10s_linear_infinite] pointer-events-none opacity-60 z-0" />
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
                animate={isPending ? { x: [-4, 4, -4, 4, 0], rotate: [-2, 2, -2, 2, 0] } : {}}
                transition={{ repeat: isPending ? Infinity : 0, duration: 0.2 }}
                onClick={runMockScanner}
                disabled={isPending}
                className="w-full aspect-square max-w-[240px] rounded-full bg-[#EF4444] border-8 border-black shadow-[8px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-4 cursor-crosshair disabled:opacity-50 relative z-10"
                style={{ background: 'radial-gradient(circle at 30% 30%, #ff7373, #EF4444)' }}
              >
                <Radar className="w-20 h-20 text-white" />
                <span className="font-black text-2xl uppercase text-white tracking-wider" style={{ WebkitTextStroke: '1px black' }}>SCAN</span>
              </motion.button>
            </div>
            <Radar className="absolute top-0 right-0 w-64 h-64 text-black opacity-5 group-hover:rotate-45 transition-transform duration-1000" />
          </motion.div>
        </div>

        {/* MIDDLE BENTO ROW */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
          
          {/* KEYWORDS / AGENTS */}
          <motion.div variants={item} className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0_0_#000] flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
                <div className="bg-[#A3E635] p-3 border-4 border-black">
                  <Swords className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-2xl md:text-3xl uppercase">Deployed Agents ({keywords.length})</h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <input id="keyword-input" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addKeyword()} placeholder="Track a keyword (e.g. 'looking for CRM')..." className="flex-1 border-4 border-black bg-[#F4F0EA] p-3 font-black text-lg focus:outline-none focus:ring-4 focus:ring-[#FFE600]" />
                <select value={selectedHeroClass} onChange={(e) => setSelectedHeroClass(e.target.value)} className="border-4 border-black bg-[#FFE600] p-3 font-black text-sm uppercase focus:outline-none">
                  <option value="Warrior 🥷">Warrior 🥷</option>
                  <option value="Mage 🧙‍♂️">Mage 🧙‍♂️</option>
                  <option value="Knight 🦸‍♂️">Knight 🦸‍♂️</option>
                </select>
                <button type="button" onClick={addKeyword} disabled={isPending} className="border-4 border-black bg-[#06B6D4] hover:bg-cyan-400 p-3 font-black shadow-[4px_4px_0_0_#000] disabled:opacity-50 uppercase flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5 stroke-[3px]" /> Deploy
                </button>
              </div>

              {/* QUICK PRESET TAGS */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs uppercase font-black text-gray-500 mr-1">Quick Presets:</span>
                {PRESET_KEYWORDS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    disabled={isPending}
                    className="bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3px]" /> "{preset}"
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {keywords.map((keyword, idx) => {
                  const heroIcon = idx % 4 === 0 ? '🥷' : idx % 4 === 1 ? '🧙‍♂️' : '🦸‍♂️'
                  return (
                    <motion.div key={keyword.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-3 border-4 border-black bg-black text-white px-4 py-2 font-black shadow-[4px_4px_0_0_#A3E635]">
                      <span className="text-[#A3E635] text-lg">{heroIcon}</span>
                      <span className="uppercase tracking-wide">"{keyword.phrase}"</span>
                      <button type="button" onClick={() => removeKeyword(keyword.id)} disabled={isPending} className="ml-2 bg-[#EF4444] text-white p-1 hover:bg-red-600 border-2 border-transparent hover:border-white transition-colors">
                        <X size={18} className="stroke-[3px]" />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* LEADERBOARD & CHARTS */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="bg-[#FFE600] border-4 border-black p-6 flex flex-col justify-between shadow-[6px_6px_0_0_#000] h-full">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="w-6 h-6 stroke-[3px]" />
                  <h3 className="font-black uppercase text-xl">Top Hunters</h3>
                </div>
                <div className="space-y-3">
                  {dbLeaderboard.slice(0, 3).map((u, idx) => (
                    <div key={idx} className={`p-3 border-2 border-black flex justify-between items-center ${idx === 0 ? 'bg-white shadow-[2px_2px_0_0_#000] scale-105' : 'bg-[#F4F0EA]'}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg">#{idx + 1}</span>
                        <span className="font-black uppercase text-sm truncate max-w-[100px]">{u.name || 'Anon'}</span>
                      </div>
                      <span className="bg-black text-white px-2 py-1 text-xs font-black uppercase">Lvl {u.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#A3E635] border-4 border-black p-6 flex flex-col justify-between shadow-[6px_6px_0_0_#000] h-full">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-6 h-6 stroke-[3px]" />
                  <h3 className="font-black uppercase text-xl">7-Day Kills</h3>
                </div>
                <div className="grid grid-cols-7 gap-1 h-32 items-end border-b-4 border-black pb-2">
                  {dbAnalytics.map((item, idx) => {
                    const heightPct = item.claimed ? Math.min(100, (item.claimed / 35) * 100) : 5
                    return (
                      <div key={item.day} className="flex flex-col items-center gap-1 h-full justify-end">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${heightPct}%` }} transition={{ duration: 0.5, delay: idx * 0.1 }} className="w-full bg-black" />
                        <span className="text-[10px] font-black uppercase">{item.day.slice(0, 1)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM ROW: BOUNTY BOARD (Leads) */}
        <motion.div variants={item}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-[#EF4444] p-4 border-4 border-black shadow-[6px_6px_0_0_#000] -rotate-3">
                <Flame className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl uppercase font-black tracking-tight text-black" style={{ WebkitTextStroke: '1px white' }}>The Bounty Board</h2>
                <div className="bg-black text-white px-3 py-1 inline-block uppercase text-sm font-black mt-2">
                  {filteredLeads.length} Open Bounties
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => setFilter(platform)}
                  className={`border-4 border-black px-4 py-2 font-black uppercase text-sm shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1 ${filter === platform ? 'bg-[#FFE600]' : 'bg-white hover:bg-gray-100'}`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredLeads.map((lead) => {
                const intentScore = getIntentScore(lead.id)
                return (
                  <motion.article
                    layout
                    key={lead.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white border-4 border-black flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Bounty Header */}
                    <div className="bg-black text-white p-4 flex justify-between items-start border-b-4 border-black">
                      <div>
                        <div className="text-xs uppercase font-black text-[#A3E635] mb-1">{lead.platform}</div>
                        <div className="text-lg font-black uppercase truncate max-w-[180px]">{lead.author}</div>
                      </div>
                      <div className="bg-[#EF4444] border-2 border-white px-2 py-1 text-center shadow-[2px_2px_0_0_#fff] rotate-3">
                        <div className="text-[10px] uppercase font-black leading-none">Intent</div>
                        <div className="text-xl font-black leading-none mt-1">{intentScore}%</div>
                      </div>
                    </div>

                    {/* Bounty Content */}
                    <div className="p-6 flex-1 bg-[#F4F0EA]">
                      <p className="font-bold text-lg leading-relaxed relative z-10">"{lead.content}"</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        <span className="bg-white border-2 border-black px-2 py-1 text-xs font-black uppercase">
                          MATCH: {lead.matched}
                        </span>
                        <span className="bg-white border-2 border-black px-2 py-1 text-xs font-black uppercase">
                          {ageLabel(lead.sourceCreatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t-4 border-black bg-white space-y-3">
                      <div className="flex gap-3">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => claimLead(lead.id)} disabled={isPending} className="flex-1 bg-[#A3E635] hover:bg-lime-400 border-4 border-black py-3 font-black uppercase shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1 flex items-center justify-center gap-2">
                          <Swords className="w-5 h-5" /> Claim (+150 XP)
                        </motion.button>
                        <a href={lead.url} target="_blank" rel="noreferrer" className="w-14 bg-[#06B6D4] hover:bg-cyan-400 border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1">
                          <ExternalLink className="w-6 h-6 stroke-[3px]" />
                        </a>
                      </div>
                      
                      <div className="flex gap-3">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => generateAIReply(lead)} disabled={isPending || user.level < 5} className={`flex-1 border-4 border-black py-2 font-black text-xs uppercase flex items-center justify-center gap-2 ${user.level >= 5 ? 'bg-[#A855F7] text-white hover:bg-purple-500 shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1' : 'bg-gray-200 text-gray-500 shadow-none'}`}>
                          {user.level >= 5 ? <Wand2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />} AI Reply {user.level < 5 && '(Lvl 5)'}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => exportToCRM(lead)} disabled={isPending || user.level < 10} className={`flex-1 border-4 border-black py-2 font-black text-xs uppercase flex items-center justify-center gap-2 ${user.level >= 10 ? 'bg-black text-white hover:bg-zinc-800 shadow-[4px_4px_0_0_#A3E635] active:shadow-none active:translate-y-1 active:translate-x-1' : 'bg-gray-200 text-gray-500 shadow-none'}`}>
                          {user.level >= 10 ? <Database className="w-4 h-4" /> : <Lock className="w-4 h-4" />} CRM Export {user.level < 10 && '(Lvl 10)'}
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Trash */}
                    <button onClick={() => dismissLead(lead.id)} disabled={isPending} className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 border-2 border-black hover:bg-red-600 shadow-[2px_2px_0_0_#000]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.article>
                )
              })}
            </AnimatePresence>
          </div>

          {!filteredLeads.length && (
            <div className="mt-8 border-4 border-black bg-white p-8 md:p-12 text-center flex flex-col items-center shadow-[8px_8px_0_0_#000]">
              <div className="bg-[#FFE600] p-4 border-4 border-black mb-4 -rotate-3 shadow-[4px_4px_0_0_#000]">
                <Radar className="w-16 h-16 text-black" />
              </div>
              <h3 className="font-black text-3xl md:text-4xl uppercase tracking-tight text-black">
                No Bounties Discovered Yet
              </h3>
              <p className="mt-2 text-base font-bold text-gray-600 uppercase max-w-lg">
                Deploy your first hero agent keyword to begin auto-scraping live customer leads!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const inputEl = document.getElementById('keyword-input')
                  if (inputEl) {
                    inputEl.focus()
                    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  } else {
                    handlePresetClick('looking for CRM')
                  }
                }}
                className="mt-6 bg-[#A3E635] hover:bg-lime-400 text-black border-4 border-black px-6 py-4 font-black text-xl uppercase shadow-[6px_6px_0_0_#000] active:translate-y-1 active:shadow-none flex items-center gap-3 cursor-pointer"
              >
                <Plus className="w-6 h-6 stroke-[4px]" /> DEPLOY FIRST AGENT TO START HUNTING
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
