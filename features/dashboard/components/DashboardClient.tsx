'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { X } from 'lucide-react'
import { useState } from 'react'

import { useDashboardState } from '@/features/dashboard/hooks/useDashboardState'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { DashboardStats } from '@/features/dashboard/components/DashboardStats'
import { DashboardKeywords } from '@/features/dashboard/components/DashboardKeywords'
import DashboardFeed from '@/features/dashboard/components/DashboardFeed'
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
const DashboardRadar = dynamic(
  () => import('@/features/dashboard/components/DashboardRadar').then((module) => module.DashboardRadar),
  {
    loading: () => (
      <div className="xl:col-span-4 min-h-[420px] border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000] animate-pulse" />
    ),
  }
)
const DashboardLeaderboard = dynamic(
  () => import('@/features/dashboard/components/DashboardLeaderboard').then((module) => module.DashboardLeaderboard),
  {
    loading: () => (
      <div className="min-h-[420px] border-4 border-black bg-[#F7D046] p-6 shadow-[6px_6px_0_0_#000] animate-pulse" />
    ),
  }
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
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#F4F0EA] px-4 pb-16 pt-4 font-black text-black md:px-6 md:pb-16 md:pt-6">
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

      <div className="relative z-10 mx-auto flex w-full max-w-7xl min-w-0 flex-col space-y-4 overflow-x-hidden">
        <h1 className="sr-only">CoQuest dashboard</h1>

        <DashboardHeader
          item={sectionReveal}
          subscriptionTier={state.subscriptionTier}
          characterTitle={state.characterTitle}
          user={state.user}
          remainingQuests={state.remainingQuests}
          maxCredits={state.maxCredits}
          setIsManaShopOpen={(open) => {
            if (open) window.location.assign('/app/billing')
          }}
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
              className="flex items-center justify-between border-4 border-black bg-[#06B6D4] p-4 text-lg font-black text-black shadow-[4px_4px_0_0_#000]"
            >
              <span>{state.notice}</span>
              <button type="button" aria-label="Dismiss notice" onClick={() => state.setNotice('')}>
                <X aria-hidden="true" className="h-6 w-6 stroke-[3px]" />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

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

        <div className={`${isOverview ? 'grid' : 'hidden'} grid-cols-1 gap-8 sm:grid`}>
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

        <div className={`${isOverview ? 'grid' : 'hidden'} grid-cols-1 items-stretch gap-8 sm:grid xl:grid-cols-2`}>
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
