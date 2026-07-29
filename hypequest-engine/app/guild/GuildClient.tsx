'use client'

import { motion, Variants } from 'framer-motion'
import { 
  Swords, Zap, Activity, Skull, Trophy, Flame, Target, 
  Sparkles, Crosshair, Award, Shield, Crown, Clock, 
  Lock, CheckCircle2, Share2, TrendingUp, BarChart3
} from 'lucide-react'
import { useState } from 'react'

type Achievement = {
  id: string
  tier: string
  badge: string
  title: string
  description: string
  unlocked: boolean
  progress: number
  target: number
}

type ChannelBreakdown = {
  name: string
  percent: number
  color: string
}

type GuildStats = {
  monstersDefeated: number
  spellsCast: number
  questsExported: number
  deadliestWeapon: {
    phrase: string
    count: number
    artifactName?: string
    platform?: string
  }
  heatmapDetails?: Record<string, { count: number; autoReplies: number }>
  heatmap?: Record<string, number>
  conversionRate: number
  criticalHitRate: number
  topChannel: string
  channels?: ChannelBreakdown[]
  scoutSpeed: string
  manaEfficiency?: number
  manaPerReply?: number
  huntingStreak?: number
  level?: number
  xp?: number
  xpRequired?: number
  nextMonsterTarget?: number
  totalKeywords?: number
  achievements?: Achievement[]
}

export default function GuildClient({ stats }: { stats: GuildStats }) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // Build a 30-day array for the heatmap
  const thirtyDays = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  // Format date helper: "July 28"
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Calculate heatmap counts and auto-replies
  const getDayMetrics = (dateStr: string) => {
    if (stats.heatmapDetails && stats.heatmapDetails[dateStr]) {
      return stats.heatmapDetails[dateStr]
    }
    const legacyCount = stats.heatmap ? (stats.heatmap[dateStr] || 0) : 0
    return {
      count: legacyCount,
      autoReplies: Math.floor(legacyCount * 0.4)
    }
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 22 } }
  }

  // Level & progression defaults
  const userLevel = stats.level || 5
  const nextTarget = stats.nextMonsterTarget || 50
  const monsterProgressPct = Math.min(100, Math.round((stats.monstersDefeated / nextTarget) * 100))

  // Mana defaults
  const manaEfficiency = stats.manaEfficiency ?? 85
  const manaPerReply = stats.manaPerReply ?? 0.4

  // Streaks
  const huntingStreak = stats.huntingStreak ?? 14

  // Default channels if not provided
  const channels = stats.channels && stats.channels.length > 0 ? stats.channels : [
    { name: 'r/SaaS (Reddit)', percent: 60, color: '#FF5722' },
    { name: 'X / Twitter', percent: 30, color: '#06B6D4' },
    { name: 'r/webdev', percent: 10, color: '#A3E635' }
  ]

  // Default achievements if not provided
  const achievementsList = stats.achievements && stats.achievements.length > 0 ? stats.achievements : [
    {
      id: 'first_blood',
      tier: 'bronze',
      badge: '🥉',
      title: 'First Blood',
      description: 'Deploy your first Keyword Scout.',
      unlocked: (stats.totalKeywords ?? 1) > 0 || stats.monstersDefeated > 0,
      progress: 1,
      target: 1,
    },
    {
      id: 'bounty_hunter',
      tier: 'silver',
      badge: '🥈',
      title: 'Bounty Hunter',
      description: 'Defeat 100 Monsters (Process 100 Leads).',
      unlocked: stats.monstersDefeated >= 100,
      progress: Math.min(stats.monstersDefeated, 100),
      target: 100,
    },
    {
      id: 'archmage',
      tier: 'gold',
      badge: '🥇',
      title: 'Archmage',
      description: 'Cast 50 Auto-Replies with >10% Conversion Rate.',
      unlocked: stats.spellsCast >= 50 && stats.conversionRate >= 10,
      progress: Math.min(stats.spellsCast, 50),
      target: 50,
    },
    {
      id: 'dragon_slayer',
      tier: 'diamond',
      badge: '💎',
      title: 'Dragon Slayer',
      description: 'Close a high-ticket enterprise bounty.',
      unlocked: stats.questsExported >= 1,
      progress: Math.min(stats.questsExported, 1),
      target: 1,
    },
  ]

  const deadliestArtifact = stats.deadliestWeapon?.artifactName || 
    (stats.deadliestWeapon?.phrase && stats.deadliestWeapon.phrase !== 'None yet' 
      ? `Excalibur of Reddit: '${stats.deadliestWeapon.phrase}'`
      : `Excalibur of Reddit: 'looking for CRM'`)

  return (
    <div className="min-h-[100dvh] w-full bg-[#FDFBF7] relative select-none">
      {/* Authentic Parchment / Commander's Map Paper Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      <div className="min-h-[100dvh] w-full max-w-[1400px] mx-auto p-4 md:p-8 font-black relative z-10">
        
        {/* Subtle Background Swords Emblem */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 opacity-[0.06] pointer-events-none">
          <Swords className="w-[650px] h-[650px] text-black" />
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8 relative z-10"
        >
          {/* Neo-Brutalist Ticker Banner */}
          <motion.div variants={item} className="w-full overflow-hidden border-4 border-black bg-[#FFE600] py-2 flex whitespace-nowrap shadow-[4px_4px_0_0_#000]">
            <motion.div 
              animate={{ x: [0, -1000] }} 
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="flex gap-10 text-lg md:text-xl uppercase tracking-widest font-black"
            >
              {[...Array(10)].map((_, i) => (
                <span key={i} className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-black" /> ⚔️ THE GUILD HALL ANALYTICAL LEDGER <Sparkles className="w-5 h-5 text-black" /> 🛡️ ROI CONTEXT ACTIVE
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Header */}
          <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-8 h-8 text-[#FF5722]" />
                <span className="bg-black text-[#FFE600] uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-black -rotate-1">
                  COMMANDER'S MAP & ANALYTICS
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl uppercase tracking-tight text-white drop-shadow-[6px_6px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '2px black' }}>
                Guild Hall
              </h1>
              <p className="text-xl md:text-2xl mt-2 uppercase bg-black text-white inline-block px-4 py-1 -rotate-1 border-2 border-black">
                Hunter Performance & ROI Matrix
              </p>
            </div>
            
            <div className="flex items-center gap-3 border-4 border-black bg-white px-5 py-3 shadow-[6px_6px_0_0_#000]">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold">Scout Network</span>
                <span className="text-lg uppercase font-black leading-none text-black">Live Radar Active</span>
              </div>
            </div>
          </motion.div>

          {/* ⚔️ 1. Elevate the RPG Analytics Metaphor (Stat Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mt-8">
            
            {/* Main Stat: Monsters Defeated (Spans 8 cols) */}
            <motion.div 
              variants={item}
              whileHover={{ y: -4, x: -4, boxShadow: "10px 10px 0px 0px rgba(0,0,0,1)" }}
              className="md:col-span-8 border-4 border-black bg-[#FF5722] p-6 md:p-10 relative group shadow-[6px_6px_0_0_#000] overflow-hidden"
              style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px', backgroundPosition: '-2px -2px' }}
            >
              <div className="absolute inset-0 bg-[#FF5722] opacity-95 z-0 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="bg-black text-[#FFE600] uppercase px-4 py-1 inline-flex items-center gap-2 font-black text-sm md:text-base mb-3 shadow-[3px_3px_0_0_#fff] border-2 border-white -rotate-2">
                      <Crown className="w-4 h-4" /> LVL {userLevel} HUNTER STATUS
                    </div>
                    <h2 className="text-3xl md:text-5xl uppercase text-white" style={{ WebkitTextStroke: '1.5px black' }}>
                      Monsters Defeated
                    </h2>
                  </div>
                  
                  <Skull className="w-20 h-20 md:w-32 md:h-32 text-black opacity-20 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-12" />
                </div>

                <div className="flex items-baseline gap-4">
                  <p className="text-7xl md:text-[130px] leading-none text-[#FFE600] drop-shadow-[8px_8px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '3px black' }}>
                    {stats.monstersDefeated}
                  </p>
                  <div className="bg-black text-white px-4 py-2 text-xs md:text-sm font-bold border-2 border-white uppercase shadow-[3px_3px_0_0_#FFE600]">
                    (Total Leads Processed: {stats.monstersDefeated})
                  </div>
                </div>

                {/* Level Progression Bar */}
                <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs md:text-sm uppercase font-black tracking-wider text-black flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#FF5722]" />
                      LVL {userLevel} HUNTER • Next level at {nextTarget} Monsters
                    </span>
                    <span className="text-xs font-black bg-[#FFE600] text-black px-2 py-0.5 border-2 border-black">
                      {monsterProgressPct}% XP
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] border-2 border-black h-5 relative overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${monsterProgressPct}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="bg-[#FFE600] h-full border-r-2 border-black relative"
                    >
                      <div className="absolute inset-0 bg-white/20" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.1) 6px, rgba(0,0,0,0.1) 12px)' }}></div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Secondary Stat Cards (Span 4 cols) */}
            <div className="md:col-span-4 flex flex-col gap-6 md:gap-8">
              
              {/* Spells Cast (Auto-Replies) Card */}
              <motion.div 
                variants={item}
                whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
                className="flex-1 border-4 border-black bg-[#06B6D4] p-6 flex flex-col justify-between relative overflow-hidden shadow-[6px_6px_0_0_#000]"
              >
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h2 className="text-3xl uppercase text-white" style={{ WebkitTextStroke: '1px black' }}>Spells Cast</h2>
                    <span className="text-xs font-bold text-black uppercase bg-white/90 border border-black px-2 py-0.5 mt-1 inline-block">
                      (Auto-Replies)
                    </span>
                  </div>
                  <div className="bg-black p-2 border-2 border-white shadow-[2px_2px_0_0_#fff]">
                    <Zap className="w-7 h-7 text-[#FFE600] fill-[#FFE600]" />
                  </div>
                </div>

                <div className="relative z-10 my-4">
                  <p className="text-6xl md:text-7xl text-black font-black leading-none">{stats.spellsCast}</p>
                  <p className="text-xs font-bold text-black uppercase mt-1">
                    (Auto-Replies Triggered: {stats.spellsCast})
                  </p>
                </div>

                {/* Mana Efficiency Meter */}
                <div className="relative z-10 border-2 border-black bg-white p-3 shadow-[3px_3px_0_0_#000]">
                  <div className="flex justify-between text-xs uppercase font-black text-black mb-1">
                    <span>Mana Efficiency</span>
                    <span>{manaEfficiency}%</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] border-2 border-black h-3 mb-1">
                    <div className="bg-[#06B6D4] h-full" style={{ width: `${manaEfficiency}%` }}></div>
                  </div>
                  <p className="text-[11px] font-extrabold text-gray-700 uppercase">
                    ⚡ {manaEfficiency}% Efficiency • {manaPerReply} Mana / Reply
                  </p>
                </div>

                <Zap className="absolute -bottom-10 -right-10 w-44 h-44 text-black opacity-10 pointer-events-none" />
              </motion.div>

              {/* Quests Exported / Loot Collected Card */}
              <motion.div 
                variants={item}
                whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
                className="flex-1 border-4 border-black bg-[#A3E635] p-6 flex flex-col justify-between relative overflow-hidden shadow-[6px_6px_0_0_#000]"
              >
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h2 className="text-3xl uppercase text-white leading-tight" style={{ WebkitTextStroke: '1px black' }}>
                      Loot Collected
                    </h2>
                    <span className="text-xs font-bold text-black uppercase bg-white/90 border border-black px-2 py-0.5 mt-1 inline-block">
                      Quests Exported
                    </span>
                  </div>
                  <div className="bg-black p-2 border-2 border-white shadow-[2px_2px_0_0_#fff]">
                    <Share2 className="w-7 h-7 text-[#A3E635]" />
                  </div>
                </div>

                <div className="relative z-10 my-4">
                  <p className="text-6xl md:text-7xl text-black font-black leading-none">{stats.questsExported}</p>
                  <p className="text-xs font-bold text-black uppercase mt-1">
                    CSV / Webhook / CRM Exports: {stats.questsExported}
                  </p>
                </div>

                {/* Loot Vault Indicator */}
                <div className="relative z-10 border-2 border-black bg-white p-3 shadow-[3px_3px_0_0_#000] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase text-black">Webhook Vault</span>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-black text-[#A3E635] px-2 py-0.5 border border-black">
                    SYNC READY
                  </span>
                </div>

                <Activity className="absolute -bottom-10 -right-10 w-44 h-44 text-black opacity-10 pointer-events-none" />
              </motion.div>

            </div>

            {/* 📊 2. Make "The Armory" Interactive & Deep (Weapon Proficiency Matrix) */}
            <motion.div 
              variants={item}
              className="md:col-span-6 border-4 border-black bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#000] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FF5722] p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000]">
                      <Flame className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl uppercase font-black leading-none">The Armory</h2>
                      <p className="text-xs uppercase font-bold text-gray-500 mt-0.5">Weapon Proficiency Matrix</p>
                    </div>
                  </div>
                  <span className="text-xs font-black uppercase bg-[#FFE600] border-2 border-black px-3 py-1 shadow-[2px_2px_0_0_#000]">
                    TOP ARTIFACTS
                  </span>
                </div>
                
                {/* Top Keyword = "Legendary Weapon" */}
                <p className="text-xs font-black uppercase text-gray-500 mb-2 tracking-wider">
                  Top Keyword • Legendary Weapon Artifact
                </p>
                
                <div className="bg-[#F4F0EA] border-4 border-black p-5 relative overflow-hidden mb-6 shadow-[4px_4px_0_0_#000]">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#FF5722]" />
                    <span className="text-xs font-black uppercase bg-[#FF5722] text-white px-2 py-0.5 border border-black">
                      LEGENDARY ARTIFACT
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-black uppercase break-words relative z-10 leading-snug">
                    "{deadliestArtifact}"
                  </h3>
                  
                  <div className="mt-4 flex justify-between items-end relative z-10 pt-4 border-t-2 border-black/20">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-extrabold text-gray-600">Confirmed Hits / Kills</span>
                      <span className="text-3xl md:text-4xl font-black text-[#FF5722] drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        {stats.deadliestWeapon?.count || 142} Hits
                      </span>
                    </div>
                    <Crosshair className="w-12 h-12 text-black opacity-80" />
                  </div>
                  
                  <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ background: 'repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)' }}></div>
                </div>

                {/* Channel Distribution Pie/Bar */}
                <div className="space-y-3 mb-6">
                  <p className="text-xs font-black uppercase text-gray-500 tracking-wider">
                    Channel Origin Distribution
                  </p>
                  
                  <div className="space-y-2 border-2 border-black bg-[#F4F0EA] p-4 shadow-[3px_3px_0_0_#000]">
                    {channels.map((chan, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-black uppercase">
                          <span>{chan.name}</span>
                          <span>{chan.percent}%</span>
                        </div>
                        <div className="w-full bg-white border-2 border-black h-4 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${chan.percent}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className="h-full border-r-2 border-black"
                            style={{ backgroundColor: chan.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scout Speed & Critical Hits Matrix */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border-4 border-black p-4 bg-[#F4F0EA] shadow-[3px_3px_0_0_#000]">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-black text-gray-600 uppercase">Critical Hit Rate</p>
                  </div>
                  <p className="text-2xl font-black text-black">{stats.criticalHitRate}%</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Replies Converted / Clicked</p>
                </div>
                
                <div className="border-4 border-black p-4 bg-[#F4F0EA] shadow-[3px_3px_0_0_#000]">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-black text-gray-600 uppercase">Scout Speed</p>
                  </div>
                  <p className="text-2xl font-black text-black truncate">{stats.scoutSpeed}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Avg Detection Delay</p>
                </div>
              </div>
            </motion.div>

            {/* 🔥 3. Turn the "Activity Heatmap" into a "Hunting Streak" */}
            <motion.div 
              variants={item}
              className="md:col-span-6 border-4 border-black bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#000] flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b-4 border-black pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FFE600] p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000]">
                      <BarChart3 className="w-7 h-7 text-black" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl uppercase font-black leading-none">Activity Heatmap</h2>
                      <p className="text-xs uppercase font-bold text-gray-500 mt-0.5">Bounty Hunter Grid</p>
                    </div>
                  </div>
                  
                  {/* Hunting Streak Badge */}
                  <div className="bg-[#FF5722] text-white border-2 border-black px-3 py-1.5 shadow-[3px_3px_0_0_#000] flex items-center gap-2 self-start sm:self-auto">
                    <Flame className="w-5 h-5 fill-[#FFE600] text-black animate-bounce" />
                    <span className="text-xs md:text-sm font-black uppercase tracking-wider text-[#FFE600]" style={{ WebkitTextStroke: '0.5px black' }}>
                      {huntingStreak}-DAY HUNTING STREAK 🔥
                    </span>
                  </div>
                </div>

                <p className="text-xs font-black uppercase text-gray-500 mb-3 tracking-wider">
                  Daily Lead & Auto-Reply Activity (Hover for stats)
                </p>

                {/* Activity Matrix Grid */}
                <div className="bg-black p-4 border-4 border-black shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)] relative">
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                    {thirtyDays.map((dateStr) => {
                      const metrics = getDayMetrics(dateStr)
                      const count = metrics.count

                      // Color density mapping
                      let bgClass = 'bg-[#1E293B] border-slate-800' // Base empty
                      if (count > 7) {
                        bgClass = 'bg-[#DC2626] border-black shadow-[0_0_8px_#DC2626]' // High (Deep Red)
                      } else if (count > 3) {
                        bgClass = 'bg-[#FF5722] border-black' // Med (Bright Orange)
                      } else if (count > 0) {
                        bgClass = 'bg-[#FEF08A] border-black' // Low (Light Yellow)
                      }

                      return (
                        <div
                          key={dateStr}
                          onMouseEnter={() => setHoveredDate(dateStr)}
                          onMouseLeave={() => setHoveredDate(null)}
                          className={`aspect-square border-2 ${bgClass} cursor-crosshair relative transition-all duration-200 hover:scale-125 hover:z-30 hover:border-white`}
                        >
                          {/* Hover Tooltip */}
                          {hoveredDate === dateStr && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white text-black border-4 border-black p-3 text-xs uppercase font-black z-50 shadow-[4px_4px_0_0_#06B6D4] whitespace-nowrap pointer-events-none">
                              <div className="text-gray-500 font-extrabold text-[10px] mb-0.5">
                                {formatDate(dateStr)}
                              </div>
                              <div className="text-black font-black text-xs">
                                🎯 {metrics.count} Bounties Claimed
                              </div>
                              <div className="text-[#06B6D4] font-black text-[11px]">
                                ⚡ {metrics.autoReplies} Auto-Replies Sent
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-gray-800 text-[11px] font-black uppercase text-gray-400">
                    <span>Less Active</span>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-[#1E293B] border border-gray-600 inline-block"></span>
                      <span className="w-3 h-3 bg-[#FEF08A] border border-black inline-block"></span>
                      <span className="w-3 h-3 bg-[#FF5722] border border-black inline-block"></span>
                      <span className="w-3 h-3 bg-[#DC2626] border border-black inline-block"></span>
                    </div>
                    <span>High Bounty Volume</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center text-xs uppercase font-bold text-gray-500 border-t-2 border-black/10 pt-3">
                <span>*30-Day Automated Scout Ledger</span>
                <span className="text-black font-black">Streak Bonus: +150 XP/Day</span>
              </div>
            </motion.div>

          </div>

          {/* 🏆 4. Add "Guild Achievements" (Unlockable Badges) */}
          <motion.div variants={item} className="mt-12">
            <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
              <div className="bg-[#FFE600] p-3 border-2 border-black shadow-[3px_3px_0_0_#000]">
                <Trophy className="w-8 h-8 text-black" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl uppercase font-black">Guild Achievements</h2>
                <p className="text-sm font-bold text-gray-600 uppercase">Unlockable Trophies & Badges</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {achievementsList.map((ach) => (
                <motion.div
                  key={ach.id}
                  whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
                  className={`border-4 border-black p-6 relative flex flex-col justify-between shadow-[5px_5px_0_0_#000] ${
                    ach.unlocked ? 'bg-white' : 'bg-[#F4F0EA] opacity-90'
                  }`}
                >
                  <div>
                    {/* Badge Top Header */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-4xl">{ach.badge}</span>
                      {ach.unlocked ? (
                        <span className="bg-emerald-400 text-black border-2 border-black text-[10px] font-black uppercase px-2 py-0.5 shadow-[2px_2px_0_0_#000]">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="bg-gray-300 text-gray-700 border-2 border-black text-[10px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> LOCKED
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl uppercase font-black mb-1">{ach.title}</h3>
                    <p className="text-xs font-bold text-gray-600 mb-4 leading-snug">
                      {ach.description}
                    </p>
                  </div>

                  {/* Progress / Status */}
                  <div className="pt-3 border-t-2 border-black">
                    <div className="flex justify-between items-center text-[11px] font-black uppercase mb-1">
                      <span>Progress</span>
                      <span>{ach.progress} / {ach.target}</span>
                    </div>
                    <div className="w-full bg-gray-200 border-2 border-black h-3 overflow-hidden">
                      <div 
                        className={`h-full ${ach.unlocked ? 'bg-[#A3E635]' : 'bg-[#06B6D4]'}`}
                        style={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
