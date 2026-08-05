'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Radar,
  X,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Search,
  Copy,
  Check,
  ExternalLink,
  Ban,
} from 'lucide-react'
import { sfx } from '@/lib/sfx'

type DashboardScannerModalProps = {
  setIsScannerModalOpen: (open: boolean) => void
  scanLogs: string[]
  scanStep: number
  scanOutcome?: string | null
  onAbortScan?: () => void
}

function getStepStatus(index: number, scanStep: number, scanOutcome?: string | null) {
  if (scanOutcome && index === Math.max(scanStep, 0)) return 'done'
  if (index < scanStep) return 'done'
  if (index === scanStep) return scanOutcome ? 'done' : 'active'
  return 'pending'
}

function getStepLabel(status: 'done' | 'active' | 'pending') {
  if (status === 'done') return '[✓]'
  if (status === 'active') return '[⏳]'
  return '[ ]'
}

export function DashboardScannerModal({
  setIsScannerModalOpen,
  scanLogs,
  scanStep,
  scanOutcome,
  onAbortScan,
}: DashboardScannerModalProps) {
  const [logFilter, setLogFilter] = useState('')
  const [copied, setCopied] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const close = () => {
    onAbortScan?.()
    setIsScannerModalOpen(false)
  }

  // Extract scan run ID from logs if present
  const scanRunId = useMemo(() => {
    for (const log of scanLogs) {
      const match = log.match(/durable run\s+([a-zA-Z0-9_-]+)/i) || log.match(/Run reference:\s+([a-zA-Z0-9_-]+)/i)
      if (match?.[1]) return match[1]
    }
    return null
  }, [scanLogs])

  const matchedLeadCount = scanOutcome?.match(/(\d+)\s+lead/i)?.[1] ?? '0'
  const matchedPostCount = scanOutcome?.match(/(\d+)\s+post/i)?.[1] ?? '0'

  // Calculate overall progress percentage
  const progressPercent = useMemo(() => {
    if (scanOutcome === 'succeeded' || scanOutcome === 'failed') return 100
    if (scanStep >= 3) return 75
    if (scanStep >= 2) return 40
    if (scanStep >= 1) return 20
    return 10
  }, [scanStep, scanOutcome])

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    if (!logFilter.trim()) return scanLogs
    const q = logFilter.toLowerCase()
    return scanLogs.filter((log) => log.toLowerCase().includes(q))
  }, [scanLogs, logFilter])

  // Auto scroll logs container to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [scanLogs.length])

  const copyRunId = async () => {
    if (!scanRunId) return
    try {
      await navigator.clipboard.writeText(scanRunId)
      setCopied(true)
      sfx.playCoinDrop()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs select-none">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto overscroll-contain border-4 border-outline bg-[#13D7C2] shadow-brutal-lg md:shadow-brutal-lg"
        role="dialog"
        aria-label="Battlestation live scan"
      >
        {/* Header Bar */}
        <div className="relative border-b-4 border-outline bg-[#13D7C2] px-4 py-3.5 md:px-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.26),_transparent_34%),linear-gradient(135deg,_rgba(10,23,33,0.12),_transparent_60%)] pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center border-3 border-outline bg-card shadow-brutal-sm">
                <Radar className="h-5 w-5 text-ink animate-spin" style={{ animationDuration: '4s' }} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.14em] text-ink/75">
                    Battlestation Live Radar
                  </p>
                  {scanRunId && (
                    <span className="hidden sm:inline-block bg-black text-[#FFE600] text-[9px] font-mono font-black px-1.5 py-0.5 border border-outline -rotate-1">
                      RUN #{scanRunId.slice(0, 8)}
                    </span>
                  )}
                </div>
                <h2 className="truncate text-base font-black uppercase text-ink md:text-2xl tracking-wide">
                  Tactical Scan Run
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {scanRunId && (
                <button
                  type="button"
                  onClick={copyRunId}
                  title="Copy Durable Run Reference ID"
                  className="hidden sm:flex items-center gap-1 border-3 border-outline bg-card px-2.5 py-1 text-[10px] font-black uppercase text-ink shadow-brutal-sm hover:bg-accent active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
                  <span>{copied ? 'COPIED!' : 'COPY ID'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={close}
                className="flex h-10 w-10 shrink-0 items-center justify-center border-3 border-outline bg-card text-ink shadow-brutal-sm hover:bg-accent-2 hover:text-white active:translate-x-[1px] active:translate-y-[1px] transition-all"
                aria-label="Close scanner modal"
              >
                <X className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Live Tactial Progress Bar */}
          <div className="mt-3 relative h-3 w-full border-2 border-outline bg-black/20 overflow-hidden shadow-brutal-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FFE600] via-[#06B6D4] to-[#A3E635]"
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Modal Main Grid */}
        <div className="grid gap-4 bg-[#F4EFE2] p-4 md:grid-cols-[minmax(0,1.2fr)_300px] md:p-5">
          
          {/* Left Column: Terminal Execution Console */}
          <div className="flex flex-col min-w-0 border-4 border-outline bg-[#0C1F2E] p-4 text-[#8CF3E7] shadow-brutal-lg">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#8CF3E7]/30 pb-3 text-xs font-black uppercase tracking-[0.1em]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#8CF3E7] animate-pulse" />
                <span>&gt; Tactical Signal Terminal</span>
              </div>

              {/* Log Search Filter Input */}
              <div className="relative flex items-center">
                <Search className="absolute left-2 size-3 text-[#8CF3E7]/60 pointer-events-none" />
                <input
                  type="text"
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  placeholder="Filter logs..."
                  className="w-28 sm:w-36 bg-[#06121C] text-[#8CF3E7] placeholder-[#8CF3E7]/40 border border-[#8CF3E7]/40 pl-6 pr-2 py-0.5 text-[10px] font-mono font-bold focus:outline-none focus:border-[#8CF3E7]"
                />
              </div>
            </div>

            {/* Scrollable Terminal Output */}
            <div
              ref={logContainerRef}
              className="max-h-[280px] sm:max-h-[340px] overflow-y-auto space-y-2.5 font-mono text-xs sm:text-sm leading-relaxed pr-1"
            >
              {filteredLogs.length === 0 ? (
                <div className="text-xs text-[#8CF3E7]/50 italic py-4 text-center">
                  No execution logs match filter &quot;{logFilter}&quot;.
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const status = getStepStatus(index, scanStep, scanOutcome)

                  return (
                    <div key={`${index}-${log.slice(0, 20)}`} className="space-y-1">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="shrink-0 font-bold text-[#FFE600]">{getStepLabel(status)}</span>
                        <span className="min-w-0 break-words">{log}</span>
                      </div>

                      {status === 'active' && (
                        <div className="ml-6 h-1.5 w-32 overflow-hidden border border-[#8CF3E7]/40 bg-[#8CF3E7]/10">
                          <motion.div
                            className="h-full bg-[#8CF3E7]"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Status Summary & Actions */}
          <div className="space-y-4">
            
            {/* Scan Status Card */}
            <div className="border-4 border-outline bg-card p-4 shadow-brutal-lg">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/60">
                Scan Status
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm font-black uppercase text-ink">
                {scanOutcome === 'succeeded' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    Hunt Completed
                  </>
                ) : scanOutcome === 'failed' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-[#E11D48]" />
                    Scan Interrupted
                  </>
                ) : (
                  <>
                    <Clock3 className="h-4 w-4 text-[#0F766E] animate-spin" style={{ animationDuration: '3s' }} />
                    Radar In Motion ({progressPercent}%)
                  </>
                )}
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.04em] text-ink/70 leading-normal">
                Track live signal pressure and review matched leads before momentum drops.
              </p>
            </div>

            {/* Tactical Yield Metrics */}
            <div className="border-4 border-outline bg-highlight p-4 shadow-brutal-lg">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/60">
                Tactical Yield
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border-3 border-outline bg-card p-2.5 text-center shadow-brutal-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink/60">
                    Leads
                  </p>
                  <p className="mt-1 text-2xl font-black uppercase text-ink">
                    {matchedLeadCount}
                  </p>
                </div>

                <div className="border-3 border-outline bg-card p-2.5 text-center shadow-brutal-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink/60">
                    Posts
                  </p>
                  <p className="mt-1 text-2xl font-black uppercase text-ink">
                    {matchedPostCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Command Notes */}
            <div className="border-4 border-outline bg-card p-4 shadow-brutal-lg">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/60">
                Command Notes
              </p>

              <div className="mt-2.5 space-y-2 text-xs font-bold uppercase tracking-[0.04em] text-ink/80">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
                  <span>Review fresh matches first for highest conversion.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
                  <span>Durable runs preserve state across page reloads.</span>
                </div>
              </div>
            </div>

            {/* Outcome Report Banner */}
            <AnimatePresence mode="wait">
              {scanOutcome === 'succeeded' ? (
                <motion.div
                  key="outcome"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="border-4 border-outline bg-[#D9FFE3] p-3.5 shadow-brutal-lg"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#15803D]" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-ink/60">
                        Outcome Report
                      </p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.04em] text-ink">
                        Hunt Completed Successfully!
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : scanOutcome === 'failed' ? (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="border-4 border-outline bg-[#FFF1F2] p-3.5 shadow-brutal-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#E11D48]" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-ink/60">
                        Scan Interrupted
                      </p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.04em] text-ink">
                        Scan credit was refunded or paused.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="border-4 border-outline bg-highlight p-3.5 shadow-brutal-lg"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-ink animate-spin" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-ink/60">
                        Awaiting Result
                      </p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.04em] text-ink leading-snug">
                        Channel open while battlestation routes hunt.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button Cluster */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
              {scanOutcome === 'succeeded' ? (
                <Link
                  href="/app/runs"
                  onClick={close}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-3 border-outline bg-accent px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-on-accent shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>VIEW QUEST BOARD</span>
                </Link>
              ) : !scanOutcome ? (
                <button
                  type="button"
                  onClick={close}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border-3 border-outline bg-accent-2 text-white px-3 py-2 text-xs font-black uppercase tracking-[0.08em] shadow-brutal-sm hover:bg-red-600 transition-all"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>CANCEL SCAN</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={close}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-3 border-outline bg-black px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-[#FFE600] shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 transition-all"
              >
                <span>RETURN TO COMMAND</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  )
}
