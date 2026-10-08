'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useDashboardState } from '@/features/dashboard/hooks/useDashboardState'
import { DashboardStats } from '@/features/dashboard/components/DashboardStats'
import { DashboardKeywords } from '@/features/dashboard/components/DashboardKeywords'
import DashboardFeed from '@/features/dashboard/components/DashboardFeed'
import { DashboardRadar } from '@/features/dashboard/components/DashboardRadar'
import { DashboardLeaderboard } from '@/features/dashboard/components/DashboardLeaderboard'
import { DashboardValleyHero } from '@/features/dashboard/components/DashboardValleyHero'
import { DashboardQuotaDock } from '@/features/dashboard/components/DashboardQuotaDock'
import { matchesIntentFilter, type LeadIntentFilter } from '@/features/dashboard/lib/leadScore'
import Link from 'next/link'
import MissionControlShell from '@/features/dashboard/components/layout/MissionControlShell'
import { ReplyDraftPanel } from '@/features/dashboard/components/ReplyDraftPanel'
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
  outcomeWorkspace,
}: {
  dbUser: DashboardUser
  dbKeywords: DashboardKeyword[]
  dbLeads: DashboardLead[]
  dbAnalytics: AnalyticsData
  dbLeaderboard: LeaderboardUser[]
  outcomeWorkspace?: ReactNode
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
  const [intentFilter, setIntentFilter] = useState<LeadIntentFilter>('all')
  const feedLeads = useMemo(
    () => state.filteredLeads.filter((lead) => matchesIntentFilter(lead, intentFilter)),
    [state.filteredLeads, intentFilter]
  )
  const isScanning = state.isScannerModalOpen || state.asyncStatus === 'scanning'
  const canScan = Boolean(state.user.entitlements?.canUsePaidScans)
  const shouldReduceMotion = useReducedMotion()
  const reveal = dashboardReveal(shouldReduceMotion)


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
    requestAnimationFrame(() => scrollToDashboardId('battle-ready-signals', shouldReduceMotion))
  }

  const openKeywordForm = () => {
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
    // Dusk and the handbook faces come from <html> now, which the whole app
    // shares; a second data-theme here would repaint the theme's gradient
    // over the shell's sky.
    <div
      className={`relative min-h-[100dvh] w-full max-w-full overflow-x-clip px-2 pb-12 pt-3 text-ink sm:px-4 md:px-6 md:pb-12 md:pt-5`}
    >
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

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] min-w-0 flex-col overflow-x-clip">
        <MissionControlShell
          chrome={
            <motion.header variants={reveal} initial="hidden" animate="show">
              <DashboardValleyHero
                name={state.user.name}
                level={state.user.level}
                title={state.characterTitle}
                leads={state.leads}
                filter={intentFilter}
                onFilter={(next) => {
                  setIntentFilter(next)
                  requestAnimationFrame(() => scrollToDashboardId('discovered-opportunities', shouldReduceMotion))
                }}
              />
            </motion.header>
          }
          opportunities={
            <section id="discovered-opportunities" aria-labelledby="discovered-opportunities-title" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="discovered-opportunities-title" className="font-mono text-sm font-semibold tracking-wider text-ink">
                    YOUR LEADS
                  </h2>
                  {intentFilter !== 'all' ? (
                    <p className="text-xs text-ink-muted">
                      Showing {intentFilter === 'engage' ? 'leads scoring 80 or more' : 'leads with no score yet'}.{' '}
                      <button type="button" className="underline" onClick={() => setIntentFilter('all')}>
                        Show all
                      </button>
                    </p>
                  ) : null}
                </div>
                {canScan ? (
                  <button
                    type="button"
                    onClick={state.runMockScanner}
                    disabled={isScanning || state.remainingQuests < 1}
                    className="inline-flex min-h-11 items-center rounded-[10px] border border-outline bg-card px-4 font-mono text-xs font-semibold text-ink transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isScanning ? 'Scan running…' : state.remainingQuests < 1 ? 'No scan credits left' : 'Run scan · 1 credit'}
                  </button>
                ) : (
                  <Link
                    href="/app/billing"
                    className="inline-flex min-h-11 items-center rounded-[10px] border border-outline bg-card px-4 font-mono text-xs font-semibold text-ink hover:bg-accent"
                  >
                    Scans need a paid plan
                  </Link>
                )}
              </div>
              {state.replyDraft ? (
                <ReplyDraftPanel
                  key={state.replyDraft.leadId}
                  draft={state.replyDraft}
                  onClose={() => state.setReplyDraft(null)}
                />
              ) : null}
              <DashboardFeed
                item={reveal}
                filteredLeads={feedLeads}
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
            </section>
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
            <div>
              <UrgentSignalsStrip
                item={reveal}
                leads={state.leads}
                onOpenQueue={openLeadQueue}
                onOpenLead={(lead) => state.handleClaimBounty(lead)}
              />
            </div>
          }
          pulse={
            <div className="space-y-3">
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

              {outcomeWorkspace}


              <div>
                <DashboardKeywords
                  item={reveal}
                  keywords={state.keywords}
                  newKeyword={state.newKeyword}
                  setNewKeyword={state.setNewKeyword}
                  addKeyword={state.addKeyword}
                  removeKeyword={state.removeKeyword}
                  PRESET_KEYWORDS={state.PRESET_KEYWORDS}
                  handlePresetClick={state.handlePresetClick}
                  isPending={state.isPending}
                />
              </div>

              <div>
                <DashboardRadar
                  item={reveal}
                  particles={state.particles}
                  keywords={state.keywords}
                  isPending={state.isPending}
                  runMockScanner={state.runMockScanner}
                />
              </div>

              <div>
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
            <div className="grid grid-cols-1 gap-6 sm:gap-8">
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
              {/* The page passes no leaderboard or chart data yet; an always-empty panel only adds noise. */}
              {dbLeaderboard.length > 0 || dbAnalytics.length > 0 ? (
                <DashboardLeaderboard
                  item={reveal}
                  dbLeaderboard={dbLeaderboard}
                  dbAnalytics={dbAnalytics}
                />
              ) : null}
            </div>
          }
        />
        <DashboardQuotaDock
          remaining={state.remainingQuests}
          max={state.maxCredits}
          plan={state.subscriptionTier}
          canUsePaidScans={canScan}
        />
      </div>
    </div>
  )
}
