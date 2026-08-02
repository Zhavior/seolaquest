'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Radio } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  text: string
  type: 'scan' | 'lead' | 'mana' | 'system'
}

const DEFAULT_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: '06:54:12',
    text: '⚔️ SCOUT_BOT_01: Scanning r/SaaS for "Looking for CRM"...',
    type: 'scan',
  },
  {
    id: '2',
    timestamp: '06:54:15',
    text: '🔥 HIGH INTENT LEAD DETECTED: u/DevFounder ($1,200/mo Opportunity)',
    type: 'lead',
  },
  {
    id: '3',
    timestamp: '06:54:16',
    text: '🧪 -10 MP Consumed. Bounty Card added to Board!',
    type: 'mana',
  },
]

const ROTATING_ACTIVITIES = [
  { text: '📡 HUNTER_AGENT_02: Querying X/Twitter API for "alternative to HubSpot"...', type: 'scan' as const },
  { text: '🔥 HIGH INTENT LEAD DETECTED: u/SaaSBuilder ($800/mo Opportunity)', type: 'lead' as const },
  { text: '🧪 -10 MP Consumed. Bounty Card added to Board!', type: 'mana' as const },
  { text: '⚡ SCOUT_BOT_03: Scraped 42 threads across r/webdev & r/startups...', type: 'scan' as const },
  { text: '⚔️ GUILD_BOT: Analyzing user intent confidence (94% Match)...', type: 'system' as const },
  { text: '🔥 HIGH INTENT LEAD DETECTED: u/DevOpsGuru ($2,400/mo Opportunity)', type: 'lead' as const },
]

export default function BountyTerminalFeed() {
  const [logs, setLogs] = useState<LogEntry[]>(DEFAULT_LOGS)
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let activityIdx = 0
    const interval = setInterval(() => {
      const now = new Date()
      const timestamp = now.toTimeString().split(' ')[0]
      const activity = ROTATING_ACTIVITIES[activityIdx % ROTATING_ACTIVITIES.length]
      
      const newEntry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp,
        text: activity.text,
        type: activity.type,
      }

      setLogs((prev) => [...prev.slice(-15), newEntry])
      activityIdx++
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="my-6 border-4 border-black bg-black text-[#A3E635] shadow-[8px_8px_0_0_#000] relative overflow-hidden font-mono">
      {/* CRT Scanline Effect Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-20 opacity-60" />

      {/* Terminal Header */}
      <div className="bg-[#111] border-b-4 border-black p-3 flex items-center justify-between text-xs font-black uppercase tracking-widest text-[#FFE600] relative z-10">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-500 animate-ping" />
          <Terminal className="w-4 h-4 text-[#A3E635]" />
          <span>Bounty Radar Live Terminal Feed</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-[#A3E635] text-black px-2 py-0.5 font-bold text-[10px] uppercase">
            24/7 AI HUNTER ACTIVE
          </span>
          <span className="text-zinc-500">v2.4 CRT</span>
        </div>
      </div>

      {/* Scrolling Log Feed */}
      <div
        ref={logContainerRef}
        className="p-4 max-h-[160px] overflow-y-auto space-y-2 text-xs md:text-sm relative z-10 leading-relaxed custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            let textColor = 'text-[#A3E635]'
            if (log.type === 'lead') textColor = 'text-[#FFE600] font-black'
            if (log.type === 'mana') textColor = 'text-[#38BDF8]'
            if (log.type === 'scan') textColor = 'text-[#A3E635]'

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-2 ${textColor}`}
              >
                <span className="text-zinc-500 select-none">[{log.timestamp}]</span>
                <span>{log.text}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Blinking Cursor */}
        <div className="flex items-center gap-1 text-[#FFE600] mt-1">
          <span className="text-zinc-500 font-bold">&gt;</span>
          <span className="animate-pulse font-black text-base">█</span>
        </div>
      </div>
    </div>
  )
}
