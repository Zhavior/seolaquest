import { motion } from 'framer-motion'
import { X, Radio, Sparkles } from 'lucide-react'
import AccessibleDialog from '@/components/AccessibleDialog'

type DashboardScannerModalProps = {
  setIsScannerModalOpen: (open: boolean) => void
  scanLogs: string[]
  scanStep: number
  scanOutcome: 'waiting' | 'pending' | 'succeeded' | 'failed'
}

export function DashboardScannerModal({ setIsScannerModalOpen, scanLogs, scanStep, scanOutcome }: DashboardScannerModalProps) {
  const close = () => setIsScannerModalOpen(false)

  return (
    <AccessibleDialog
      open
      onClose={close}
      labelledBy="dashboard-scanner-dialog-title"
      describedBy="dashboard-scanner-dialog-description"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      panelClassName="relative w-full max-w-2xl border-4 border-[#A3E635] bg-black p-4 font-mono text-[#A3E635] shadow-[12px_12px_0px_0px_rgba(255,230,0,1)] sm:p-6 md:p-10"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
    >
        <button
          onClick={close}
          aria-label="Close scan status"
          className="absolute top-4 right-4 bg-white text-black hover:bg-red-500 hover:text-white border-4 border-black p-2 transition-colors shadow-[4px_4px_0_0_#000]"
        >
          <X className="w-6 h-6 stroke-[4px]" />
        </button>

        <div className="flex items-center gap-4 border-b-4 border-[#A3E635] pb-4 mb-6">
          <Radio className="w-8 h-8 animate-pulse text-[#FFE600]" />
          <h3 id="dashboard-scanner-dialog-title" className="text-2xl md:text-3xl font-black uppercase text-[#FFE600] tracking-widest">
            CoQuest Radar v2.4
          </h3>
        </div>

        <div className="min-h-[160px] space-y-4 overflow-y-auto border-2 border-[#A3E635]/40 bg-[#111] p-4 text-sm leading-relaxed sm:min-h-[200px] sm:p-6 md:text-base">
          {scanLogs.map((log, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <span>{log}</span>
            </motion.div>
          ))}
          {scanStep > 0 && scanStep < 5 && (
            <div className="flex items-center gap-2 text-[#FFE600] animate-pulse mt-4">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>Waiting for queued provider work...</span>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <div className="w-full bg-gray-900 border-4 border-[#A3E635] h-6 overflow-hidden">
            <motion.div className="bg-[#FFE600] h-full" initial={{ width: '0%' }} animate={{ width: `${(scanStep / 5) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
          {scanStep === 5 ? (
            <button onClick={close} className="w-full bg-[#A3E635] hover:bg-lime-400 text-black font-black text-xl uppercase py-4 border-4 border-[#A3E635] shadow-[6px_6px_0px_0px_#FFE600]">
              {scanOutcome === 'succeeded' ? 'VIEW VERIFIED RESULTS ⚡' : scanOutcome === 'pending' ? 'KEEP RUN & CLOSE' : 'CLOSE STATUS'}
            </button>
          ) : (
            <p id="dashboard-scanner-dialog-description" className="text-sm text-center font-bold text-[#A3E635] uppercase tracking-wider">
              Scan status comes from the queued backend run.
            </p>
          )}
          {scanStep === 5 && (
            <p id="dashboard-scanner-dialog-description" className="sr-only">
              This status reflects the queued backend scan run.
            </p>
          )}
        </div>
    </AccessibleDialog>
  )
}
