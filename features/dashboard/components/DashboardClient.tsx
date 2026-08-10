'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Crosshair, Shield, X } from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'

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
const DeferredBattleAreaCanvas = dynamic(
  () =>
    import('@/features/dashboard/components/battle/DeferredBattleAreaCanvas').then(
      (module) => module.DeferredBattleAreaCanvas
    ),
  { ssr: false }
)

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia('(min-width: 640px)')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getDesktopSnapshot() {
  return window.matchMedia('(min-width: 640px)').matches
}

function getDesktopServerSnapshot() {
  return false
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
  const shouldReduceMotion = useReducedMotion()
  const reveal = dashboardReveal(shouldReduceMotion)
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getDesktopServerSnapshot)

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
    <div className="relative min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-surface px-4 pb-16 pt-4 font-black text-ink select-none md:px-8 md:pb-16 md:pt-6">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply',
        }}
      />

      <div className="pointer-events-none absolute top-0 right-0 -mt-24 -mr-24 hidden opacity-[0.05] md:block">
        <Crosshair className="h-[650px] w-[650px] text-ink" aria-hidden />
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
                <div className="mb-1 flex items-center gap-3">
                  <Shield className="h-7 w-7 shrink-0 text-[#FF5722]" aria-hidden />
                  <span className="-rotate-1 border-2 border-outline bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-[#FFE600]">
                    Mission Control
                  </span>
                </div>
                <h1
                  className="text-4xl uppercase tracking-tight text-white drop-shadow-brutal-lg sm:text-5xl md:text-6xl"
                  style={{ WebkitTextStroke: '2px black' }}
                >
                  Command Center
                </h1>
                <p className="mt-2 inline-block border-2 border-outline bg-black px-3 py-1 text-sm uppercase text-white md:text-base">
                  {state.user.name} · Lv {state.user.level} · {state.characterTitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="border-4 border-outline bg-card px-4 py-3 shadow-brutal">
                  <p className="text-[10px] font-bold uppercase text-ink-muted">Scan credits</p>
                  <p className="text-lg font-black uppercase leading-none text-ink">
                    {`${state.remainingQuests}/${state.maxCredits}`}
                  </p>
                </div>
                <div className="border-4 border-outline bg-card px-4 py-3 shadow-brutal">
                  <p className="text-[10px] font-bold uppercase text-ink-muted">Plan</p>
                  <p className="max-w-[14rem] truncate text-sm font-black uppercase leading-none text-ink">
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
                  className="flex flex-col gap-3 border-4 border-outline bg-[#FFE0C7] p-4 shadow-brutal sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-bold text-ink">
                    Lead queue refresh failed. Showing the last known leads — not claiming live freshness.
                  </p>
                  <button
                    type="button"
                    onClick={() => void state.refreshLeadsSlice()}
                    className="inline-flex min-h-11 items-center justify-center border-3 border-outline bg-card px-4 py-2 text-xs font-black uppercase shadow-brutal-sm"
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
                    className="flex items-center justify-between border-4 border-outline bg-info p-4 text-lg font-black text-on-accent shadow-brutal-lg"
                  >
                    <span>{state.notice}</span>
                    <button type="button" aria-label="Dismiss notice" onClick={() => state.setNotice('')}>
                      <X aria-hidden="true" className="h-6 w-6 stroke-[3px]" />
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div
                className="flex border-4 border-outline bg-card p-1 shadow-brutal sm:hidden"
                role="tablist"
                aria-label="Mission Control sections"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isOverview}
                  onClick={() => setActiveMobileTab('overview')}
                  className={`min-h-11 flex-1 border-2 px-2 py-2.5 text-xs font-black uppercase tracking-[0.08em] transition-all ${
                    isOverview
                      ? 'border-outline bg-accent text-on-accent shadow-brutal-sm'
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
                  className={`min-h-11 flex-1 border-2 px-2 py-2.5 text-xs font-black uppercase tracking-[0.08em] transition-all ${
                    isSignals
                      ? 'border-outline bg-accent text-on-accent shadow-brutal-sm'
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
                  className={`min-h-11 flex-1 border-2 px-2 py-2.5 text-xs font-black uppercase tracking-[0.08em] transition-all ${
                    isGuild
                      ? 'border-outline bg-accent text-on-accent shadow-brutal-sm'
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
              {isGuild || isDesktop ? (
                <DeferredBattleAreaCanvas userLevel={state.user.level} />
              ) : null}
            </div>
          }
        />
      </div>
    </div>
  )
}
