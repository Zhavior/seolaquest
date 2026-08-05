'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { X, Sparkles, Shield, Crosshair } from 'lucide-react'
import { useState } from 'react'

import { useDashboardState } from '@/features/dashboard/hooks/useDashboardState'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { DashboardStats } from '@/features/dashboard/components/DashboardStats'
import { DashboardKeywords } from '@/features/dashboard/components/DashboardKeywords'
import DashboardFeed from '@/features/dashboard/components/DashboardFeed'
import { DashboardRadar } from '@/features/dashboard/components/DashboardRadar'
import { DashboardLeaderboard } from '@/features/dashboard/components/DashboardLeaderboard'
import type {
  AnalyticsData,
  DashboardKeyword,
  DashboardLead,
  DashboardUser,
  LeaderboardUser,
} from '@/features/dashboard/types'

const QuickStrikeReplyModal = dynamic(() => import('@/components/QuickStrikeReplyModal'))
const DashboardScannerModal = dynamic(() =>
  import('@/features/dashboard/components/DashboardScannerModal').then((module) => module.DashboardScannerModal)
)
const BattleAreaCanvas = dynamic(
  () => import('@/features/dashboard/components/battle/BattleAreaCanvas'),
  { ssr: false }
)

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: [0.22, 1, 0.36, 1],
    },
  },
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
  const state = useDashboardState({
    dbUser,
    dbKeywords,
    dbLeads,
    dbAnalytics,
    dbLeaderboard,
  })

  const noticeIsError = /could not|failed|unavailable|did not return|not configured|requires|insufficient/i.test(
    state.notice
  )
  const [activeMobileTab, setActiveMobileTab] = useState<'overview' | 'signals' | 'guild'>('overview')

  const isOverview = activeMobileTab === 'overview'
  const isSignals = activeMobileTab === 'signals'
  const isGuild = activeMobileTab === 'guild'

  return (
    <div className="relative min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#FDFBF7] px-4 pb-16 pt-4 font-black text-black select-none md:px-8 md:pb-16 md:pt-6">
      {/* Authentic Parchment / Commander's Map Paper Overlay (1:1 with Guild Hall & Billing) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      {/* Subtle Background Watermark Emblem */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 opacity-[0.05] pointer-events-none">
        <Crosshair className="w-[650px] h-[650px] text-black" />
      </div>

      <AnimatePresence mode="wait">
        {state.activeQuickStrikeLead ? (
          <QuickStrikeReplyModal
            lead={state.activeQuickStrikeLead}
            onClose={() => state.setActiveQuickStrikeLead(null)}
            onConfirmClaim={state.handleConfirmQuickStrikeClaim}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state.isScannerModalOpen ? (
          <DashboardScannerModal
            setIsScannerModalOpen={state.setIsScannerModalOpen}
            scanLogs={state.scanLogs}
            scanStep={state.scanStep}
            scanOutcome={state.scanOutcome}
          />
        ) : null}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] min-w-0 flex-col space-y-6 overflow-x-hidden">
        <h1 className="sr-only">CoQuest main dashboard</h1>

        {/* Neo-Brutalist Ticker Banner (1:1 with Guild Hall & Billing) */}
        <motion.div variants={sectionReveal} initial="hidden" animate="show" className="w-full overflow-hidden border-4 border-black bg-[#FFE600] py-2 flex whitespace-nowrap shadow-[4px_4px_0_0_#000]">
          <motion.div 
            animate={{ x: [0, -1000] }} 
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex gap-10 text-lg md:text-xl uppercase tracking-widest font-black"
          >
            {[...Array(10)].map((_, i) => (
              <span key={i} className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-black" /> ⚔️ DASHBOARD COMMAND CENTER <Sparkles className="w-5 h-5 text-black" /> 🛡️ LIVE BATTLE EXPEDITION RADAR
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Page Title Header (1:1 with Guild Hall & Billing) */}
        <motion.div variants={sectionReveal} initial="hidden" animate="show" className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-8 h-8 text-[#FF5722]" />
              <span className="bg-black text-[#FFE600] uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-black -rotate-1">
                COMMANDER&apos;S MAP & BATTLE CONTROL
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl uppercase tracking-tight text-white drop-shadow-[6px_6px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '2px black' }}>
              Main Dashboard
            </h1>
            <p className="text-xl md:text-2xl mt-2 uppercase bg-black text-white inline-block px-4 py-1 -rotate-1 border-2 border-black">
              Tenant Operations & Campaign Telemetry
            </p>
          </div>
          
          <div className="flex items-center gap-3 border-4 border-black bg-white px-5 py-3 shadow-[6px_6px_0_0_#000]">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase text-gray-500 font-bold">EXPEDITION RADAR</span>
              <span className="text-lg uppercase font-black leading-none text-black">ACTIVE [PATROLLING]</span>
            </div>
          </div>
        </motion.div>

        <DashboardHeader
          item={sectionReveal}
          user={state.user}
          remainingQuests={state.remainingQuests}
          maxCredits={state.maxCredits}
        />

        <AnimatePresence initial={false}>
          {state.notice && !/Opened a share draft with measured dashboard counts\./i.test(state.notice) ? (
            <motion.div
              key={state.notice}
              id="dashboard-notice"
              role={noticeIsError ? 'alert' : 'status'}
              aria-live={noticeIsError ? 'assertive' : 'polite'}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between border-4 border-black bg-[#06B6D4] p-4 text-lg font-black text-black shadow-[6px_6px_0_0_#000]"
            >
              <span>{state.notice}</span>
              <button type="button" aria-label="Dismiss notice" onClick={() => state.setNotice('')}>
                <X aria-hidden="true" className="h-6 w-6 stroke-[3px]" />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Mobile Tab Selectors */}
        <div className="flex border-4 border-black bg-white p-1 shadow-[4px_4px_0_0_#000] sm:hidden">
          <button
            type="button"
            onClick={() => setActiveMobileTab('overview')}
            className={`flex-1 border-2 px-2 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
              activeMobileTab === 'overview'
                ? 'border-black bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                : 'border-transparent bg-transparent text-black/55'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('signals')}
            className={`flex-1 border-2 px-2 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
              activeMobileTab === 'signals'
                ? 'border-black bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                : 'border-transparent bg-transparent text-black/55'
            }`}
          >
            Signals
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('guild')}
            className={`flex-1 border-2 px-2 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
              activeMobileTab === 'guild'
                ? 'border-black bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                : 'border-transparent bg-transparent text-black/55'
            }`}
          >
            Guild
          </button>
        </div>

        {/* Hero Section & Stats */}
        <div className={`${isOverview ? 'grid' : 'hidden'} grid-cols-1 gap-6 sm:gap-8 sm:grid`}>
          <BattleAreaCanvas />
          <DashboardStats
            item={sectionReveal}
            user={state.user}
            characterTitle={state.characterTitle}
            isScanning={state.isScannerModalOpen || state.isPending}
            recentLevelUp={state.recentLevelUp}
            xpPercent={state.xpPercent}
            leads={state.leads}
            shareStats={state.shareStats}
          />
        </div>

        <div className={`${isSignals ? 'block' : 'hidden'} sm:block`}>
          <DashboardRadar
            item={sectionReveal}
            particles={state.particles}
            keywords={state.keywords}
            isPending={state.isPending}
            runMockScanner={state.runMockScanner}
          />
        </div>

        <div className={`${isOverview ? 'grid' : 'hidden'} grid-cols-1 items-stretch gap-6 sm:gap-8 2xl:grid-cols-2`}>
          <DashboardKeywords
            item={sectionReveal}
            keywords={state.keywords}
            newKeyword={state.newKeyword}
            setNewKeyword={state.setNewKeyword}
            selectedHeroClass={state.selectedHeroClass}
            setSelectedHeroClass={state.setSelectedHeroClass}
            addKeyword={state.addKeyword}
            removeKeyword={state.removeKeyword}
            PRESET_KEYWORDS={state.PRESET_KEYWORDS}
            handlePresetClick={state.handlePresetClick}
            isPending={state.isPending}
          />

          <div className="hidden sm:block">
            <DashboardLeaderboard
              item={sectionReveal}
              dbLeaderboard={dbLeaderboard}
              dbAnalytics={dbAnalytics}
            />
          </div>
        </div>

        <div className={`${isSignals ? 'block' : 'hidden'} sm:block`}>
          <DashboardFeed
            item={sectionReveal}
            filteredLeads={state.filteredLeads}
            filter={state.filter}
            setFilter={state.setFilter}
            platforms={state.platforms}
            dismissLead={state.dismissLead}
            isPending={state.isPending}
            handleClaimBounty={state.handleClaimBounty}
            generateAIReply={state.generateAIReply}
            exportToCRM={state.exportToCRM}
            handlePresetClick={state.handlePresetClick}
          />
        </div>

        <div className={`${isGuild ? 'block' : 'hidden'} sm:hidden`}>
          <DashboardLeaderboard
            item={sectionReveal}
            dbLeaderboard={dbLeaderboard}
            dbAnalytics={dbAnalytics}
          />
        </div>
      </div>
    </div>
  )
}
