'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Shield, Flame, Trophy, ExternalLink, Sparkles, CheckCircle2, Search, ArrowUpRight } from 'lucide-react'

export default function DashboardPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [userXp, setUserXp] = useState(1250)
  const [userLevel, setUserLevel] = useState(4)
  const [claimedQuests, setClaimedQuests] = useState<string[]>([])

  const [quests, setQuests] = useState([
    {
      id: 'q_init_1',
      platform: 'Reddit',
      source: 'r/SaaS',
      author: 'u/indie_builder',
      content: 'Looking for an affordable alternative to Mention.com for my new AI startup.',
      intentScore: 96,
      xpReward: 150,
      estimatedValue: '$120/mo',
      timeAgo: '4m ago',
      url: 'https://reddit.com'
    },
    {
      id: 'q_init_2',
      platform: 'Twitter',
      source: '@buildinpublic',
      author: '@alex_m',
      content: 'Any tools that alert you when someone posts "need a web designer" on Twitter?',
      intentScore: 92,
      xpReward: 180,
      estimatedValue: '$800 project',
      timeAgo: '11m ago',
      url: 'https://x.com'
    }
  ])

  // Trigger Attack Mode Scanner
  const triggerScan = async () => {
    setIsScanning(true)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: ['need developer', 'mention alternative'] })
      })
      const data = await res.json()
      if (data.success) {
        setTimeout(() => {
          setQuests((prev) => [...data.questsFound, ...prev])
          setIsScanning(false)
        }, 1200)
      }
    } catch {
      setIsScanning(false)
    }
  }

  // Claim Quest & Gain XP
  const claimQuest = (questId: string, xpAmount: number) => {
    if (claimedQuests.includes(questId)) return
    setClaimedQuests((prev) => [...prev, questId])
    setUserXp((prev) => {
      const newXp = prev + xpAmount
      if (newXp >= 1500) {
        setUserLevel((lvl) => lvl + 1)
      }
      return newXp
    })
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* HERO METRICS HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEVEL & XP CARD */}
        <div className="bg-[#FFE600] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1">
          <div className="flex items-center justify-between">
            <span className="bg-black text-white font-black text-xs uppercase px-2 py-0.5 border border-black">
              HERO LEVEL {userLevel}
            </span>
            <Trophy className="w-6 h-6 stroke-[2.5px]" />
          </div>
          <h2 className="text-3xl font-black uppercase mt-2">Knight Slasher</h2>
          
          {/* CANDY STRIPE XP BAR */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-black mb-1">
              <span>XP PROGRESS</span>
              <span>{userXp} / 2000 XP</span>
            </div>
            <div className="w-full h-5 bg-white border-2 border-black overflow-hidden relative">
              <motion.div
                className="h-full bg-[#A3E635]"
                initial={{ width: '0%' }}
                animate={{ width: `${(userXp / 2000) * 100}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </div>
        </div>

        {/* EST MRR OPPORTUNITY */}
        <div className="bg-[#06B6D4] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-1 text-white">
          <span className="bg-black text-cyan-300 font-black text-xs uppercase px-2 py-0.5 border border-white">
            POTENTIAL PIPELINE
          </span>
          <h2 className="text-4xl font-black text-black mt-2">$2,670 / mo</h2>
          <p className="text-xs font-black text-black mt-2">
            🔥 5 High-Intent Quests awaiting direct reply in your active feed.
          </p>
        </div>

        {/* ATTACK MODE SCAN BUTTON */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div>
            <span className="bg-red-500 text-white font-black text-xs uppercase px-2 py-0.5 border border-black">
              API RADAR ACTIVE
            </span>
            <h3 className="text-xl font-black uppercase mt-2">Force Network Scan</h3>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            animate={isScanning ? { x: [-4, 4, -4, 4, 0], rotate: [-2, 2, -2, 2, 0] } : {}}
            transition={{ repeat: isScanning ? Infinity : 0, duration: 0.2 }}
            onClick={triggerScan}
            disabled={isScanning}
            className="mt-4 w-full bg-[#EF4444] hover:bg-red-600 text-white font-black text-lg uppercase py-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>💥 SCANNING SOCIAL NETWORK...</>
            ) : (
              <>⚔️ ATTACK MODE (SCAN NOW)</>
            )}
          </motion.button>
        </div>

      </div>

      {/* QUEST FEED SECTION */}
      <div className="space-y-4">
        <div className="bg-[#A3E635] border-3 border-black p-4 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase flex items-center gap-2">
            <Zap className="w-6 h-6 stroke-[3px]" /> Active Lead Quests ({quests.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {quests.map((q) => {
              const isClaimed = claimedQuests.includes(q.id)

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${
                    isClaimed ? 'opacity-60 bg-slate-100' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <span className="bg-black text-white font-black text-[10px] uppercase px-2 py-0.5">
                          {q.platform} • {q.source}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{q.timeAgo}</span>
                        <span className="bg-[#FFE600] font-black text-xs px-2 py-0.5 border border-black">
                          🔥 {q.intentScore}% Intent Score
                        </span>
                      </div>

                      <p className="text-lg font-bold text-black leading-snug">
                        "{q.content}"
                      </p>

                      <div className="text-xs font-black text-slate-700 flex items-center gap-3">
                        <span>Author: <span className="underline">{q.author}</span></span>
                        <span>Est. Value: <span className="text-green-600 font-extrabold">{q.estimatedValue}</span></span>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                      <a
                        href={q.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-100 hover:bg-slate-200 text-black font-black text-xs uppercase px-4 py-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                      >
                        Open Post <ArrowUpRight className="w-4 h-4 stroke-[3px]" />
                      </a>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => claimQuest(q.id, q.xpReward)}
                        disabled={isClaimed}
                        className={`font-black text-xs uppercase px-5 py-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 ${
                          isClaimed
                            ? 'bg-slate-300 text-slate-700'
                            : 'bg-[#FFE600] hover:bg-yellow-300 text-black'
                        }`}
                      >
                        {isClaimed ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-700 stroke-[3px]" /> QUEST CLAIMED!
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 stroke-[3px]" /> CLAIM (+{q.xpReward} XP)
                          </>
                        )}
                      </motion.button>
                    </div>

                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

    </div>
  )
}
