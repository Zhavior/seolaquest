'use client'

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { X } from 'lucide-react'
import QuickStrikeReplyModal from '@/components/QuickStrikeReplyModal'

import { useDashboardState } from '@/features/dashboard/hooks/useDashboardState'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { DashboardStats } from '@/features/dashboard/components/DashboardStats'
import { DashboardRadar } from '@/features/dashboard/components/DashboardRadar'
import { DashboardKeywords } from '@/features/dashboard/components/DashboardKeywords'
import { DashboardLeaderboard } from '@/features/dashboard/components/DashboardLeaderboard'
import { DashboardFeed } from '@/features/dashboard/components/DashboardFeed'
import { DashboardScannerModal } from '@/features/dashboard/components/DashboardScannerModal'
import { DashboardUser, DashboardKeyword, DashboardLead, AnalyticsData, LeaderboardUser } from '@/features/dashboard/types'

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

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }
  const noticeIsError = /could not|failed|unavailable|did not return|not configured|requires|insufficient/i.test(state.notice)

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black p-4 md:p-8 font-black overflow-hidden relative">
      {/* Quick-Strike Auto-Reply Modal */}
      <AnimatePresence>
        {state.activeQuickStrikeLead && (
          <QuickStrikeReplyModal
            lead={state.activeQuickStrikeLead}
            onClose={() => state.setActiveQuickStrikeLead(null)}
            onConfirmClaim={state.handleConfirmQuickStrikeClaim}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.isScannerModalOpen && (
          <DashboardScannerModal
            setIsScannerModalOpen={state.setIsScannerModalOpen}
            scanLogs={state.scanLogs}
            scanStep={state.scanStep}
            scanOutcome={state.scanOutcome}
          />
        )}
      </AnimatePresence>

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-8 relative z-10">
        <h1 className="sr-only">CoQuest dashboard</h1>
        
        {/* SESSION BAR & LIVE MANA LIQUID METER */}
        <DashboardHeader
          item={item}
          subscriptionTier={state.subscriptionTier}
          characterTitle={state.characterTitle}
          user={state.user}
          remainingQuests={state.remainingQuests}
          maxCredits={state.maxCredits}
          setIsManaShopOpen={(open) => {
            if (open) window.location.assign('/app/billing')
          }}
        />

        {state.notice && (
          <motion.div id="dashboard-notice" role={noticeIsError ? 'alert' : 'status'} aria-live={noticeIsError ? 'assertive' : 'polite'} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#06B6D4] text-black font-black text-lg p-4 border-4 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-between">
            <span>{state.notice}</span>
            <button type="button" aria-label="Dismiss notice" onClick={() => state.setNotice('')}><X aria-hidden="true" className="w-6 h-6 stroke-[3px]" /></button>
          </motion.div>
        )}

        {/* TOP BENTO ROW */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <DashboardStats
            item={item}
            user={state.user}
            characterTitle={state.characterTitle}
            isScanning={state.isScannerModalOpen || state.isPending}
            recentLevelUp={state.recentLevelUp}
            xpPercent={state.xpPercent}
            leads={state.leads}
            shareStats={state.shareStats}
          />

          <DashboardRadar
            item={item}
            particles={state.particles}
            keywords={state.keywords}
            isPending={state.isPending}
            runMockScanner={state.runMockScanner}
          />
        </div>

        {/* MIDDLE BENTO ROW */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
          <DashboardKeywords
            item={item}
            keywords={state.keywords}
            newKeyword={state.newKeyword}
            setNewKeyword={state.setNewKeyword}
            selectedHeroClass={state.selectedHeroClass}
            setSelectedHeroClass={state.setSelectedHeroClass}
            isPending={state.isPending}
            PRESET_KEYWORDS={state.PRESET_KEYWORDS}
            addKeyword={state.addKeyword}
            handlePresetClick={state.handlePresetClick}
            removeKeyword={state.removeKeyword}
            notice={state.notice}
            noticeIsError={noticeIsError}
          />

          <DashboardLeaderboard
            item={item}
            dbLeaderboard={dbLeaderboard}
            dbAnalytics={dbAnalytics}
          />
        </div>

        {/* BOTTOM ROW: BOUNTY BOARD (Leads) */}
        <DashboardFeed
          item={item}
          filteredLeads={state.filteredLeads}
          platforms={state.platforms}
          filter={state.filter}
          setFilter={state.setFilter}
          isPending={state.isPending}
          handleClaimBounty={state.handleClaimBounty}
          generateAIReply={state.generateAIReply}
          exportToCRM={state.exportToCRM}
          dismissLead={state.dismissLead}
          handlePresetClick={state.handlePresetClick}
        />

      </motion.div>
    </div>
  )
}
