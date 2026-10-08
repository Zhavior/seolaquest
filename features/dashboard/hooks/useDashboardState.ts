import { useState, useTransition, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { sfx } from '@/lib/sfx'
import {
  addKeywordAction,
  claimQuestAction,
  dismissLeadAction,
  removeKeywordAction,
  scanForLeadsAction,
  generateAIReplyAction,
  exportToCRMAction
} from '@/features/dashboard/actions'
import {
  DashboardUser,
  DashboardKeyword,
  DashboardLead,
  AnalyticsData,
  LeaderboardUser
} from '@/features/dashboard/types'
import { fingerprintKeywords, fingerprintLeads } from '@/features/dashboard/lib/serverSnapshot'
import { isBuyerIntentNoise } from '@/src/modules/leads/domain/buyerIntentNoise'

export type DashboardAsyncStatus = 'idle' | 'scanning' | 'claiming' | 'replying' | 'exporting'
export type DashboardSliceStatus = 'ok' | 'degraded'
type ScanOutcome = 'waiting' | 'pending' | 'succeeded' | 'failed'
type ScanStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED_REFUNDED' | 'DEAD' | 'CANCELLED' | 'UNKNOWN'

const SCAN_STATUS_TIMEOUT_MS = 75_000
const SCAN_STATUS_POLL_MS = 1_500

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type ReplyDraft = { leadId: string; author: string; url: string; text: string }

export function useDashboardState({
  dbUser,
  dbKeywords,
  dbLeads,
}: {
  dbUser: DashboardUser
  dbKeywords: DashboardKeyword[]
  dbLeads: DashboardLead[]
  dbAnalytics: AnalyticsData
  dbLeaderboard: LeaderboardUser[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /*
   * The hunter is read straight from the server prop rather than mirrored into
   * state. It used to be a `useState` seeded from `dbUser` and re-synced by an
   * effect, which only made sense while claiming a lead paid XP on the spot and
   * the client wanted to move the bar before the server agreed. Nothing writes
   * progression on the client any more — the Gamify ledger owns it — so the
   * copy had exactly one job left: drift out of date until an effect caught up.
   */
  const user = dbUser
  const [keywords, setKeywords] = useState(dbKeywords)
  const [leads, setLeads] = useState<DashboardLead[]>(dbLeads)
  const [newKeyword, setNewKeyword] = useState('')
  const [notice, setNotice] = useState('')
  
  const [asyncStatus, setAsyncStatus] = useState<DashboardAsyncStatus>('idle')
  const [isPending, startTransition] = useTransition()
  
  const [isManaShopOpen, setIsManaShopOpen] = useState(false)
  const [remainingQuests, setRemainingQuests] = useState(dbUser.questsRemaining ?? 0)
  const [claimedCount, setClaimedCount] = useState(0)
  const [particles] = useState<{ id: number; x: number; y: number }[]>([])
  const [leadsSliceStatus, setLeadsSliceStatus] = useState<DashboardSliceStatus>('ok')

  const [activeQuickStrikeLead, setActiveQuickStrikeLead] = useState<DashboardLead | null>(null)
  const [recentLevelUp, setRecentLevelUp] = useState(false)
  const lastSeenLevelRef = useRef(dbUser.level)

  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false)
  const [scanLogs, setScanLogs] = useState<string[]>([])
  const [replyDraft, setReplyDraft] = useState<ReplyDraft | null>(null)
  const [scanStep, setScanStep] = useState(0)
  const [scanOutcome, setScanOutcome] = useState<ScanOutcome>('waiting')
  const restoredScanRef = useRef<string | null>(null)
  const activeScanAbortRef = useRef<AbortController | null>(null)

  /*
   * Last server snapshots we already applied. Optimistic client edits (add /
   * dismiss / claim) must not be clobbered by a parent re-render that still
   * carries the previous RSC payload — only a *changed* fingerprint adopts.
   */
  const lastKeywordsFpRef = useRef(fingerprintKeywords(dbKeywords))
  const lastLeadsFpRef = useRef(fingerprintLeads(dbLeads))
  const lastCreditsRef = useRef(dbUser.questsRemaining ?? 0)

  const filter = searchParams.get('platform') || 'ALL'

  const keywordsFp = fingerprintKeywords(dbKeywords)
  const leadsFp = fingerprintLeads(dbLeads)
  const serverCredits = dbUser.questsRemaining ?? 0

  useEffect(() => {
    if (keywordsFp === lastKeywordsFpRef.current) return
    lastKeywordsFpRef.current = keywordsFp
    setKeywords(dbKeywords)
  }, [keywordsFp, dbKeywords])

  useEffect(() => {
    if (leadsFp === lastLeadsFpRef.current) return
    lastLeadsFpRef.current = leadsFp
    setLeads(dbLeads)
    setLeadsSliceStatus('ok')
  }, [leadsFp, dbLeads])

  useEffect(() => {
    if (serverCredits === lastCreditsRef.current) return
    lastCreditsRef.current = serverCredits
    setRemainingQuests(serverCredits)
  }, [serverCredits])

  /**
   * Background leads slice refresh — updates the queue without remounting the
   * dashboard shell. Used after a successful scan so new matches appear even
   * before RSC props catch up. Failures mark the slice degraded; local leads stay.
   */
  const refreshLeadsSlice = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/leads', { cache: 'no-store' })
      if (!response.ok) {
        setLeadsSliceStatus('degraded')
        return
      }
      const payload = (await response.json()) as { ok?: boolean; leads?: DashboardLead[] }
      if (!payload.ok || !Array.isArray(payload.leads)) {
        setLeadsSliceStatus('degraded')
        return
      }
      const nextFp = fingerprintLeads(payload.leads)
      lastLeadsFpRef.current = nextFp
      setLeads(payload.leads)
      setLeadsSliceStatus('ok')
    } catch {
      setLeadsSliceStatus('degraded')
    }
  }, [])

  const setFilter = useCallback(
    (newFilter: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newFilter === 'ALL') {
        params.delete('platform')
      } else {
        params.set('platform', newFilter)
      }
      const queryString = params.toString()
      window.history.replaceState(null, '', `${pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`)
    },
    [searchParams, pathname]
  )

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        if (filter !== 'ALL' && lead.platform !== filter) return false
        // Data-layer gate for already-ingested trading/job/promo noise.
        if (isBuyerIntentNoise(lead.content)) return false
        return true
      }),
    [filter, leads],
  )
  const platforms = ['ALL', ...Array.from(new Set(leads.map((lead) => lead.platform)))]
  const xpPercent = Math.min(100, Math.round((user.xp / Math.max(1, user.xpRequired)) * 100))

  const characterTitle = user.title || 'Hunter'
  const subscriptionTier = user.planLabel || 'PLAN UNAVAILABLE'
  const maxCredits = Math.max(0, user.maxCredits ?? 0, remainingQuests)
  const PRESET_KEYWORDS = ['looking for CRM', 'best SaaS for...', 'alternative to...']

  const abortActiveScan = useCallback(() => {
    if (activeScanAbortRef.current) {
      activeScanAbortRef.current.abort()
      activeScanAbortRef.current = null
    }
  }, [])

  // Clean up scan polling on unmount
  useEffect(() => {
    return () => {
      abortActiveScan()
    }
  }, [abortActiveScan])

  function addKeyword() {
    const phrase = newKeyword.trim()
    if (!phrase) return
    startTransition(async () => {
      const result = await addKeywordAction(phrase)
      if (!result.ok) return setNotice(result.message ?? 'Could not add keyword.')
      if (!result.keyword) return setNotice('Keyword saved, but the server did not return its ID. Refresh before deleting it.')
      setKeywords((current) => [result.keyword, ...current.filter((keyword) => keyword.id !== result.keyword.id)])
      setNewKeyword('')
      sfx.playConfirm()
      setNotice(result.message ?? 'Keyword added.')
    })
  }

  function handlePresetClick(phrase: string) {
    startTransition(async () => {
      const result = await addKeywordAction(phrase)
      if (!result.ok) return setNotice(result.message ?? 'Could not add keyword.')
      if (!result.keyword) return setNotice('Keyword saved, but the server did not return its ID. Refresh before deleting it.')
      setKeywords((current) => [result.keyword, ...current.filter((keyword) => keyword.id !== result.keyword.id)])
      sfx.playConfirm()
      setNotice(result.message ?? 'Keyword added.')
    })
  }

  function removeKeyword(id: string) {
    startTransition(async () => {
      const result = await removeKeywordAction(id)
      if (!result.ok) return setNotice(result.message ?? 'Could not remove keyword.')
      setKeywords((current) => current.filter((keyword) => keyword.id !== id))
      sfx.playConfirm()
      setNotice(result.message ?? 'Keyword removed.')
    })
  }

  function runMockScanner() {
    abortActiveScan()
    const controller = new AbortController()
    activeScanAbortRef.current = controller
    const { signal } = controller

    setIsScannerModalOpen(true)
    setScanLogs([
      'Starting your scan…',
      'Sending your keywords to the scanner…',
      'Asking X for matching posts…',
    ])
    setScanStep(1)
    setScanOutcome('waiting')
    setAsyncStatus('scanning')
    sfx.playRadarBlip()

    void (async () => {
      try {
        const result = await scanForLeadsAction()
        if (signal.aborted) return

        if (!result.ok || !result.runId) {
          sfx.playCriticalWarning()
          setScanLogs((current) => [...current, result.message ?? 'Scan could not be started.'])
          setNotice(result.message ?? 'Could not start scan.')
          setScanOutcome('failed')
          setScanStep(5)
          setAsyncStatus('idle')
          return
        }

        const scanRunId = result.runId
        setScanLogs((current) => [...current, `Scan started (reference ${scanRunId}).`])
        setScanStep(2)

        const deadline = Date.now() + SCAN_STATUS_TIMEOUT_MS
        let lastStatus = ''

        while (!signal.aborted && Date.now() < deadline) {
          try {
            const response = await fetch(`/api/v1/scans/${encodeURIComponent(scanRunId)}`, {
              cache: 'no-store',
              signal,
            })
            if (!response.ok) throw new Error('SCAN_STATUS_UNAVAILABLE')
            const payload = (await response.json()) as {
              scan?: {
                status?: ScanStatus
                counts?: { leadsCreated?: number }
                provider?: { status?: string }
                balance?: number | null
              }
            }
            const scan = payload.scan
            if (!scan?.status) throw new Error('SCAN_STATUS_MISSING')

            if (scan.status !== lastStatus) {
              lastStatus = scan.status
              setScanLogs((current) => [...current, `Status: ${String(scan.status).toLowerCase()}`])
              sfx.playRadarBlip()
            }

            if (scan.status === 'RUNNING') {
              setScanStep(3)
            }

            if (scan.status === 'SUCCEEDED') {
              const leadsCreated = scan.counts?.leadsCreated ?? 0
              if (leadsCreated > 0) sfx.playDiscovery()
              else sfx.playConfirm()
              const providerStatus = scan.provider?.status ?? 'unknown'
              const completed = `Scan finished: ${leadsCreated} new ${leadsCreated === 1 ? 'lead' : 'leads'} found.${providerStatus === 'AVAILABLE' ? '' : ` Search status: ${String(providerStatus).toLowerCase()}.`}`
              setScanLogs((current) => [...current, completed])
              setNotice(completed)
              if (typeof scan.balance === 'number') setRemainingQuests(scan.balance)
              setScanOutcome('succeeded')
              setScanStep(5)
              setAsyncStatus('idle')
              // One server refresh updates the queue, credits, HUD and pipeline together.
              if (signal.aborted) return
              router.refresh()
              return
            }

            if (scan.status === 'FAILED_REFUNDED') {
              sfx.playCriticalWarning()
              const failed = 'The scan failed after several tries. Your scan credit was given back.'
              setScanLogs((current) => [...current, failed])
              setNotice(failed)
              if (typeof scan.balance === 'number') setRemainingQuests(scan.balance)
              setScanOutcome('failed')
              setScanStep(5)
              setAsyncStatus('idle')
              return
            }

            if (scan.status === 'DEAD' || scan.status === 'CANCELLED' || scan.status === 'UNKNOWN') {
              sfx.playCriticalWarning()
              const failed = `The scan stopped (status: ${String(scan.status).toLowerCase()}). No new leads were added.`
              setScanLogs((current) => [...current, failed])
              setNotice(failed)
              setScanOutcome('failed')
              setScanStep(5)
              setAsyncStatus('idle')
              return
            }
          } catch (err: unknown) {
            if ((err as Error)?.name === 'AbortError') return
          }
          await wait(SCAN_STATUS_POLL_MS)
        }

        if (signal.aborted) return

        const pending = 'The scan is still waiting to start. Reload the page later to see results.'
        setScanLogs((current) => [...current, pending])
        setNotice(pending)
        setScanOutcome('pending')
        setScanStep(5)
        setAsyncStatus('idle')
      } catch {
        if (!signal.aborted) {
          setAsyncStatus('idle')
        }
      }
    })()
  }

  useEffect(() => {
    const runId = searchParams.get('scanRunId')
    if (!runId || restoredScanRef.current === runId) return
    restoredScanRef.current = runId
    setIsScannerModalOpen(true)
    setScanLogs(['Picking up your scan where it left off.', `Scan reference: ${runId}`])
    setScanStep(2)
    let cancelled = false
    void (async () => {
      const deadline = Date.now() + SCAN_STATUS_TIMEOUT_MS
      let lastStatus = ''
      while (!cancelled && Date.now() < deadline) {
        try {
          const response = await fetch(`/api/v1/scans/${encodeURIComponent(runId)}`, { cache: 'no-store' })
          if (!response.ok) throw new Error('SCAN_STATUS_UNAVAILABLE')
          const payload = await response.json() as { scan?: { status?: ScanStatus } }
          const status = payload.scan?.status ?? 'UNKNOWN'
          const previousStatus = lastStatus
          if (status !== lastStatus) {
            lastStatus = status
            setScanLogs((current) => [...current, `Status: ${String(status).toLowerCase()}`])
            sfx.playRadarBlip()
          }
          if (status === 'RUNNING') setScanStep(3)
          if (status === 'SUCCEEDED') {
            if (previousStatus && previousStatus !== 'SUCCEEDED') sfx.playConfirm()
            setScanStep(5)
            setScanOutcome('succeeded')
            if (cancelled) return
            router.refresh()
            return
          }
          if (status === 'FAILED_REFUNDED' || status === 'DEAD' || status === 'CANCELLED' || status === 'UNKNOWN') {
            sfx.playCriticalWarning()
            setScanStep(5)
            setScanOutcome('failed')
            return
          }
        } catch {
          // The URL keeps the durable run recoverable while status reads retry.
        }
        await wait(SCAN_STATUS_POLL_MS)
      }
      if (!cancelled) {
        setScanLogs((current) => [...current, 'The scan is still running. You can close this window and come back later.'])
        setScanOutcome('pending')
        setScanStep(5)
      }
    })()
    return () => { cancelled = true }
  }, [searchParams, router, refreshLeadsSlice])

  function handleClaimBounty(lead: DashboardLead) {
    sfx.playCoinDrop()
    setActiveQuickStrikeLead(lead)
  }

  function handleConfirmQuickStrikeClaim(leadId: string) {
    setActiveQuickStrikeLead(null)
    setAsyncStatus('claiming')

    startTransition(async () => {
      const result = await claimQuestAction(leadId)
      setAsyncStatus('idle')

      if (result.ok) {
        /*
         * No XP is applied here any more. Claiming emits `opportunity.engaged`
         * and the Gamify ledger decides what it is worth once the outbox
         * delivers it — a decision that can legitimately come back as nothing.
         * The old code moved the bar the instant the button was pressed, which
         * meant the HUD was showing a reward the backend had not agreed to.
         */
        if (typeof result.questsRemaining === 'number') {
          setRemainingQuests(result.questsRemaining)
        }

        sfx.playConfirm()
        setClaimedCount((current) => current + 1)
        setLeads((current) => current.filter((lead) => lead.id !== leadId))
        setNotice(result.message ?? 'Saved to Follow-ups.')
        router.refresh()
        return
      }

      setNotice(result.message ?? 'Could not save this lead. Try again.')
    })
  }

  function dismissLead(id: string) {
    setNotice('Dismissing this lead from your feed...')
    setAsyncStatus('claiming')
    startTransition(async () => {
      const result = await dismissLeadAction(id)
      setAsyncStatus('idle')
      if (result.ok) {
        setLeads((current) => current.filter((lead) => lead.id !== id))
        sfx.playConfirm()
        setNotice(result.message ?? 'Lead dismissed.')
      } else {
        setNotice(result.message ?? 'Failed to dismiss lead.')
      }
    })
  }

  function generateAIReply(lead: DashboardLead) {
    setNotice('Writing a draft reply…')
    setAsyncStatus('replying')
    startTransition(async () => {
      const result = await generateAIReplyAction(lead.id)
      setAsyncStatus('idle')
      if (result.ok && result.reply) {
        // Kept in its own box until closed, so it can be read, edited and
        // copied; a notice line is replaced by the next message.
        setReplyDraft({ leadId: lead.id, author: lead.author, url: lead.url, text: result.reply })
        setNotice('Your draft reply is ready above your leads.')
      } else {
        setNotice(result.message ?? 'Failed to generate AI reply.')
      }
    })
  }

  function exportToCRM(lead: DashboardLead) {
    setNotice(`Requesting CRM export for this ${lead.platform} lead...`)
    setAsyncStatus('exporting')
    startTransition(async () => {
      const result = await exportToCRMAction(lead.id)
      setAsyncStatus('idle')
      if (result.ok && result.deliveryId) {
        setNotice(result.message ?? 'CRM delivery queued. Opening its durable status page.')
        router.push(`/app/deliveries/${encodeURIComponent(result.deliveryId)}`)
        return
      }
      setNotice(result.message ?? 'Failed to export source match.')
    })
  }

  function shareStats() {
    const text = `I am tracking ${keywords.length} keyword${keywords.length === 1 ? '' : 's'} and reviewing ${leads.length} current lead${leads.length === 1 ? '' : 's'} in SEOlaQuest.`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setNotice('Opened a share draft with measured dashboard counts.')
  }

  /*
   * Progression arrives from the server, not from the click.
   *
   * Claiming a lead emits an event; the Gamify ledger scores it asynchronously
   * and `revalidatePath` re-renders this page with whatever it decided. So the
   * level-up flourish keys off the server's level actually rising — a real
   * event — rather than off a number the client predicted at claim time.
   */
  useEffect(() => {
    if (dbUser.level > lastSeenLevelRef.current) {
      setRecentLevelUp(true)
      sfx.playLevelUp()
    }
    lastSeenLevelRef.current = dbUser.level
  }, [dbUser])

  return {
    replyDraft,
    setReplyDraft,
    user,
    keywords,
    setKeywords,
    leads,
    setLeads,
    newKeyword,
    setNewKeyword,
    filter,
    setFilter,
    notice,
    setNotice,
    asyncStatus,
    isPending,
    isManaShopOpen,
    setIsManaShopOpen,
    remainingQuests,
    setRemainingQuests,
    claimedCount,
    particles,
    leadsSliceStatus,
    refreshLeadsSlice,
    activeQuickStrikeLead,
    setActiveQuickStrikeLead,
    recentLevelUp,
    isScannerModalOpen,
    setIsScannerModalOpen,
    scanLogs,
    scanStep,
    scanOutcome,
    filteredLeads,
    platforms,
    xpPercent,
    characterTitle,
    subscriptionTier,
    maxCredits,
    PRESET_KEYWORDS,
    addKeyword,
    handlePresetClick,
    removeKeyword,
    runMockScanner,
    abortActiveScan,
    handleClaimBounty,
    handleConfirmQuickStrikeClaim,
    dismissLead,
    generateAIReply,
    exportToCRM,
    shareStats
  }
}
