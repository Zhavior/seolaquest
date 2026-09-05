'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useDashboardState } from '@/features/dashboard/hooks/useDashboardState'
import { DashboardStats } from '@/features/dashboard/components/DashboardStats'
import { DashboardKeywords } from '@/features/dashboard/components/DashboardKeywords'
import DashboardFeed from '@/features/dashboard/components/DashboardFeed'
import { DashboardRadar } from '@/features/dashboard/components/DashboardRadar'
import { DashboardLeaderboard } from '@/features/dashboard/components/DashboardLeaderboard'
import MissionControlShell from '@/features/dashboard/components/layout/MissionControlShell'
import { TodaysMissionPanel } from '@/features/dashboard/components/mission/TodaysMissionPanel'
import { CampaignPulsePanel } from '@/features/dashboard/components/mission/CampaignPulsePanel'
import { UrgentSignalsStrip } from '@/features/dashboard/components/mission/UrgentSignalsStrip'
import { IntelLogPanel } from '@/features/dashboard/components/mission/IntelLogPanel'
import {
  deriveCampaignPulse,
  deriveTodaysMission,
} from '@/features/dashboard/lib/deriveMissionControl'
import { dashboardReveal, scrollToDashboardId } from '@/features/dashboard/lib/motion'
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
  const shouldReduceMotion = useReducedMotion()
  const reveal = dashboardReveal(shouldReduceMotion)

  const isOverview = activeMobileTab === 'overview'
  const isSignals = activeMobileTab === 'signals'
  const isGuild = activeMobileTab === 'guild'

  const missionInput = useMemo(
    () => ({
      keywords: state.keywords,
      leads: state.leads,
      remainingQuests: state.remainingQuests,
      maxCredits: state.maxCredits,
      user: state.user,
      isScanning: state.isScannerModalOpen || state.asyncStatus === 'scanning',
    }),
    [
      state.keywords,
      state.leads,
      state.remainingQuests,
      state.maxCredits,
      state.user,
      state.isScannerModalOpen,
      state.asyncStatus,
    ]
  )

  const mission = useMemo(() => deriveTodaysMission(missionInput), [missionInput])
  const pulse = useMemo(() => deriveCampaignPulse(missionInput), [missionInput])

  const openLeadQueue = () => {
    setActiveMobileTab('signals')
    requestAnimationFrame(() => scrollToDashboardId('battle-ready-signals', shouldReduceMotion))
  }

  const openKeywordForm = () => {
    setActiveMobileTab('overview')
    requestAnimationFrame(() => {
      scrollToDashboardId('tracked-keywords', shouldReduceMotion)
      document.getElementById('keyword-input')?.focus()
    })
  }

  const openClaimForLead = (leadId: string) => {
    const lead = state.leads.find((item) => item.id === leadId)
    if (lead) {
      state.handleClaimBounty(lead)
      return
    }
    openLeadQueue()
  }

  return (
    <div className="relative min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-canvas px-2 pb-12 pt-3 text-ink sm:px-4 md:px-6 md:pb-12 md:pt-5">
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
            onAbortScan={state.abortActiveScan}
          />
        ) : null}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] min-w-0 flex-col overflow-x-hidden">
        <MissionControlShell
          chrome={
            <motion.header
              variants={reveal}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
              <div className="min-w-0">
                <p className="mb-2 text-xs font-medium tracking-wide text-ink-muted">Your growth journal</p>
                <h1 className="font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
                  One useful step at a time.
                </h1>
                <p className="mt-3 text-sm text-ink-muted">
                  {state.user.name} · Lv {state.user.level} · {state.characterTitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-[20px] border border-outline bg-card px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-medium normal-case text-ink-muted">Scan credits</p>
                  <p className="text-lg font-semibold normal-case leading-none text-ink">
                    {`${state.remainingQuests}/${state.maxCredits}`}
                  </p>
                </div>
                <div className="rounded-[20px] border border-outline bg-card px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-medium normal-case text-ink-muted">Plan</p>
                  <p className="max-w-[14rem] truncate text-sm font-semibold normal-case leading-none text-ink">
                    {state.subscriptionTier}
                  </p>
                </div>
              </div>
            </motion.header>
          }
          mission={
            <TodaysMissionPanel
              item={reveal}
              mission={mission}
              isPending={state.isPending}
              onScan={state.runMockScanner}
              onReviewLeads={openLeadQueue}
              onAddKeyword={openKeywordForm}
              onClaimLead={openClaimForLead}
              onViewScan={() => state.setIsScannerModalOpen(true)}
            />
          }
          urgent={
            <div className={isOverview || isSignals ? 'block' : 'hidden sm:block'}>
              <UrgentSignalsStrip
                item={reveal}
                leads={state.leads}
                onOpenQueue={openLeadQueue}
                onOpenLead={(lead) => state.handleClaimBounty(lead)}
              />
            </div>
          }
          pulse={
            <div className={`${isOverview ? 'block' : 'hidden'} sm:block space-y-3`}>
              {state.leadsSliceStatus === 'degraded' ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col gap-3 rounded-[20px] border border-outline bg-highlight p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-medium text-ink">
                    Lead queue refresh failed. Showing the last known leads — not claiming live freshness.
                  </p>
                  <button
                    type="button"
                    onClick={() => void state.refreshLeadsSlice()}
                    className="inline-flex min-h-11 items-center justify-center rounded-[20px] border border-outline bg-card px-4 py-2 text-xs font-semibold normal-case shadow-none"
                  >
                    Retry lead refresh
                  </button>
                </div>
              ) : null}
              <CampaignPulsePanel
                item={reveal}
                pulse={pulse}
                planLabel={state.user.planLabel}
              />
            </div>
          }
          operations={
            <>
              <AnimatePresence initial={false}>
                {state.notice && !/Opened a share draft with measured dashboard counts\./i.test(state.notice) ? (
                  <motion.div
                    key={state.notice}
                    id="dashboard-notice"
                    role={noticeIsError ? 'alert' : 'status'}
                    aria-live={noticeIsError ? 'assertive' : 'polite'}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                    }
                    className="flex items-center justify-between rounded-[20px] border border-outline bg-info p-4 text-lg font-semibold text-on-accent shadow-sm"
                  >
                    <span>{state.notice}</span>
                    <button type="button" aria-label="Dismiss notice" onClick={() => state.setNotice('')}>
                      <X aria-hidden="true" className="h-6 w-6 stroke-[1.75px]" />
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <Link href="/app/leads" className="inline-flex min-h-11 items-center underline">Follow up on claimed leads</Link>

              <div
                className="flex rounded-[20px] border border-outline bg-card p-1 shadow-sm sm:hidden"
                role="tablist"
                aria-label="Mission Control sections"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isOverview}
                  onClick={() => setActiveMobileTab('overview')}
                  className={`min-h-11 flex-1 rounded-lg border px-2 py-2.5 text-xs font-semibold normal-case tracking-[0.08em] transition-all ${
                    isOverview
                      ? 'border-outline bg-accent text-on-accent shadow-none'
                      : 'border-transparent bg-transparent text-ink/55'
                  }`}
                >
                  Mission
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSignals}
                  onClick={() => setActiveMobileTab('signals')}
                  className={`min-h-11 flex-1 rounded-lg border px-2 py-2.5 text-xs font-semibold normal-case tracking-[0.08em] transition-all ${
                    isSignals
                      ? 'border-outline bg-accent text-on-accent shadow-none'
                      : 'border-transparent bg-transparent text-ink/55'
                  }`}
                >
                  Queue
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isGuild}
                  onClick={() => setActiveMobileTab('guild')}
                  className={`min-h-11 flex-1 rounded-lg border px-2 py-2.5 text-xs font-semibold normal-case tracking-[0.08em] transition-all ${
                    isGuild
                      ? 'border-outline bg-accent text-on-accent shadow-none'
                      : 'border-transparent bg-transparent text-ink/55'
                  }`}
                >
                  Progress
                </button>
              </div>

              <div className={`${isOverview ? 'block' : 'hidden'} sm:block`}>
                <DashboardKeywords
                  item={reveal}
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
              </div>

              <div className={`${isSignals ? 'block' : 'hidden'} sm:block`}>
                <DashboardFeed
                  item={reveal}
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

              <div className={`${isSignals ? 'block' : 'hidden'} sm:block`}>
                <DashboardRadar
                  item={reveal}
                  particles={state.particles}
                  keywords={state.keywords}
                  isPending={state.isPending}
                  runMockScanner={state.runMockScanner}
                />
              </div>

              <div className={`${isSignals || isGuild ? 'block' : 'hidden'} sm:block`}>
                <IntelLogPanel
                  item={reveal}
                  notice={state.notice}
                  scanOutcome={state.scanOutcome}
                  isScannerOpen={state.isScannerModalOpen}
                  onOpenScanner={() => state.setIsScannerModalOpen(true)}
                />
              </div>
            </>
          }
          strategy={
            <div className={`${isGuild ? 'grid' : 'hidden'} grid-cols-1 gap-6 sm:grid sm:gap-8`}>
              <DashboardStats
                item={reveal}
                user={state.user}
                characterTitle={state.characterTitle}
                isScanning={state.isScannerModalOpen || state.isPending}
                recentLevelUp={state.recentLevelUp}
                xpPercent={state.xpPercent}
                leads={state.leads}
                remainingQuests={state.remainingQuests}
                maxCredits={state.maxCredits}
                leadsSliceStatus={state.leadsSliceStatus}
                shareStats={state.shareStats}
              />
              <DashboardLeaderboard
                item={reveal}
                dbLeaderboard={dbLeaderboard}
                dbAnalytics={dbAnalytics}
              />
            </div>
          }
        />
      </div>
    </div>
  )
}
