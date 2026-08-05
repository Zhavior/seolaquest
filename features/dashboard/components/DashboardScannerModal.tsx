import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock3, AlertTriangle, Radar, X, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto overscroll-contain border-4 border-black bg-[#13D7C2] shadow-[6px_6px_0_0_#000] md:shadow-[12px_12px_0_0_#000]"
        role="dialog"
        aria-label="Battlestation live scan"
      >
        <div className="relative border-b-4 border-black bg-[#13D7C2] px-4 py-4 md:px-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.26),_transparent_34%),linear-gradient(135deg,_rgba(10,23,33,0.12),_transparent_60%)]" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
                <Radar className="h-5 w-5 text-black" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-black/65">
                  Battlestation live radar
                </p>
                <h2 className="truncate text-lg font-black uppercase text-black md:text-2xl">
                  Tactical Scan Run
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
        </div>

        <div className="grid gap-4 bg-[#F4EFE2] p-4 md:grid-cols-[minmax(0,1.2fr)_300px] md:p-5">
          <div className="min-w-0 border-4 border-black bg-[#0C1F2E] p-4 text-[#8CF3E7] shadow-[6px_6px_0_0_#000]">
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b-2 border-[#8CF3E7]/30 pb-3 text-xs font-black uppercase tracking-[0.1em]">
              <span>&gt; Routing live scan through command deck...</span>
              <span className="border border-[#8CF3E7]/50 px-2 py-1 text-xs">
                Live execution feed
              </span>
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

                    {status === 'active' && (
                      <div className="ml-6 h-2 w-32 overflow-hidden border border-[#8CF3E7]/40 bg-[#8CF3E7]/10">
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
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-black/55">
                Scan status
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm font-black uppercase text-black">
                {scanOutcome ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    Hunt completed
                  </>
                ) : (
                  <>
                    <Clock3 className="h-4 w-4 text-[#0F766E]" />
                    Radar in motion
                  </>
                )}
              </div>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.04em] text-black/70">
                Track live signal pressure and review matched leads before momentum drops.
              </p>
            </div>

            <div className="border-4 border-black bg-[#FFF7CC] p-4 shadow-[6px_6px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-black/55">
                Tactical yield
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border-4 border-black bg-white p-3 text-center shadow-[4px_4px_0_0_#000]">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-black/55">
                    Leads
                  </p>
                  <p className="mt-2 text-2xl font-black uppercase text-black">
                    {matchedLeadCount}
                  </p>
                </div>

                <div className="border-4 border-black bg-white p-3 text-center shadow-[4px_4px_0_0_#000]">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-black/55">
                    Posts
                  </p>
                  <p className="mt-2 text-2xl font-black uppercase text-black">
                    {matchedPostCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000]">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-black/55">
                Command notes
              </p>

              <div className="mt-3 space-y-3 text-sm font-bold uppercase tracking-[0.04em] text-black/75">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Keep the board lean. Review fresh matches first.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Best runs feel fast, focused, and immediately actionable.</span>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {scanOutcome ? (
                <motion.div
                  key="outcome"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="border-4 border-black bg-[#D9FFE3] p-4 shadow-[6px_6px_0_0_#000]"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#15803D]" />
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-black/55">
                        Outcome report
                      </p>
                      <p className="mt-2 text-sm font-black uppercase tracking-[0.05em] text-black">
                        {scanOutcome}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="border-4 border-black bg-[#FFF1F2] p-4 shadow-[6px_6px_0_0_#000]"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#E11D48]" />
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-black/55">
                        Awaiting result
                      </p>
                      <p className="mt-2 text-sm font-black uppercase tracking-[0.05em] text-black">
                        Keep this channel open while the battlestation finishes routing the hunt.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center gap-2 border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#FFE600] shadow-[4px_4px_0_0_#000]"
              >
                Return to command
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
