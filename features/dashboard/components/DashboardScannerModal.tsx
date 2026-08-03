import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock3, AlertTriangle, Radar, X, ArrowRight } from 'lucide-react'

type DashboardScannerModalProps = {
  setIsScannerModalOpen: (open: boolean) => void
  scanLogs: string[]
  scanStep: number
  scanOutcome?: string | null
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
}: DashboardScannerModalProps) {
  const close = () => setIsScannerModalOpen(false)
  const matchedLeadCount = scanOutcome?.match(/(\d+)\s+lead/i)?.[1] ?? '0'
  const matchedPostCount = scanOutcome?.match(/(\d+)\s+post/i)?.[1] ?? '0'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="w-full max-w-3xl border-4 border-black bg-[#FFE600] p-3 shadow-[12px_12px_0_0_#000] md:p-4"
      >
        <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000]">
          <div className="flex items-center justify-between gap-3 border-b-4 border-black bg-[#EF4444] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center border-4 border-black bg-white">
                <Radar className="h-5 w-5 text-black" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/80">CoQuest Radar V2.4</p>
                <h2 className="truncate text-lg font-black uppercase text-white md:text-xl">
                  Manual Scan Engine
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              className="flex h-11 w-11 shrink-0 items-center justify-center border-4 border-black bg-white text-black shadow-[4px_4px_0_0_#000]"
              aria-label="Close scanner modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.2fr)_280px] md:p-5">
            <div className="min-w-0 border-4 border-black bg-[#0B3B16] p-4 text-[#A3E635] shadow-[4px_4px_0_0_#000]">
              <div className="mb-3 flex flex-wrap items-center gap-2 border-b-2 border-[#A3E635]/40 pb-3 text-[11px] font-black uppercase tracking-[0.14em]">
                <span>&gt; Initializing scan engine...</span>
                <span className="border border-[#A3E635]/60 px-2 py-1 text-[10px]">Live execution feed</span>
              </div>

              <div className="space-y-3 font-mono text-sm leading-relaxed">
                {scanLogs.map((log, index) => {
                  const status = getStepStatus(index, scanStep, scanOutcome)

                  return (
                    <div key={`${index}-${log}`} className="space-y-1">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="shrink-0">{getStepLabel(status)}</span>
                        <span className="min-w-0 break-words">{log}</span>
                      </div>

                      {status === 'active' && index === 2 ? (
                        <div className="ml-6 space-y-1 text-xs text-[#D9F99D]">
                          <div>[✓] Querying Reddit API (r/SaaS, r/Entrepreneur)...</div>
                          <div>[✓] Querying X pulse stream for active intent...</div>
                          <div>[!] LinkedIn connector retrying in background...</div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}

                <AnimatePresence>
                  {scanOutcome ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="mt-4 border-t-2 border-[#A3E635]/40 pt-4"
                    >
                      <div className="text-xs uppercase tracking-[0.14em] text-[#D9F99D]">
                        Status: {scanOutcome}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Execution status</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 border-2 border-black bg-[#F4F0EA] px-3 py-2 text-[11px] font-black uppercase">
                    <Clock3 className="h-4 w-4 shrink-0" />
                    <span>Real-time terminal progression</span>
                  </div>
                  <div className="flex items-center gap-2 border-2 border-black bg-[#F4F0EA] px-3 py-2 text-[11px] font-black uppercase">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Queued provider tasks</span>
                  </div>
                  <div className="flex items-center gap-2 border-2 border-black bg-[#F4F0EA] px-3 py-2 text-[11px] font-black uppercase">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Live retry and warning stream</span>
                  </div>
                </div>
              </div>

              <div className="border-4 border-black bg-[#06B6D4] p-4 shadow-[4px_4px_0_0_#000]">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/70">Scan summary</p>
                <div className="mt-3 grid gap-2 text-sm font-black uppercase">
                  <div className="border-2 border-black bg-white px-3 py-2">
                    Found: {matchedPostCount} new posts
                  </div>
                  <div className="border-2 border-black bg-[#FFE600] px-3 py-2">
                    High-intent leads: {matchedLeadCount}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 border-4 border-black bg-black px-4 py-3 text-center text-sm font-black uppercase text-white shadow-[4px_4px_0_0_#000]"
                >
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  View matched leads
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
