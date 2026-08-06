'use client'

import { CheckCircle2, X } from 'lucide-react'
import AccessibleDialog from '@/components/AccessibleDialog'
import { sfx } from '@/lib/sfx'
import type { DashboardLead } from '@/features/dashboard/types'

interface QuickStrikeReplyModalProps {
  lead: DashboardLead
  onClose: () => void
  onConfirmClaim: (leadId: string) => void
}

export default function QuickStrikeReplyModal({ lead, onClose, onConfirmClaim }: QuickStrikeReplyModalProps) {
  return (
    <AccessibleDialog
      open
      onClose={onClose}
      labelledBy="quick-strike-dialog-title"
      describedBy="quick-strike-dialog-description"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      panelClassName="relative w-full max-w-2xl space-y-4 border-8 border-outline bg-canvas p-4 text-ink shadow-[14px_14px_0_0_#FFE600] sm:space-y-6 sm:p-6 md:p-8"
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
    >
        <button
          onClick={onClose}
          aria-label="Close confirmation"
          className="absolute right-4 top-4 border-3 border-outline bg-card p-2 shadow-brutal-sm"
        >
          <X className="h-5 w-5 stroke-[4px]" />
        </button>

        <div className="border-4 border-outline bg-black p-4 pr-16 text-white shadow-[4px_4px_0_0_#A3E635]">
          <h2 id="quick-strike-dialog-title" className="text-2xl font-black uppercase text-[#FFE600]">Mark lead as contacted?</h2>
          <p className="mt-1 text-xs font-bold text-ink-muted">This changes workflow state only.</p>
        </div>

        <div className="border-4 border-outline bg-card p-5 shadow-brutal">
          <p className="text-xs font-black uppercase text-ink-muted">Stored source record</p>
          <p className="mt-2 text-sm font-bold leading-relaxed text-ink">&quot;{lead.content}&quot;</p>
          <p className="mt-3 text-xs font-bold text-ink-muted">Author: {lead.author} · Platform: {lead.platform}</p>
        </div>

        <div id="quick-strike-dialog-description" className="border-3 border-outline bg-highlight p-4 text-sm font-bold leading-relaxed">
          SEOlaQuest will not post, send, or dispatch a reply from this action. Generate or copy a draft separately, then contact
          the person through the original source if appropriate.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="border-3 border-outline bg-card px-5 py-3 text-xs font-black uppercase shadow-brutal-sm">
            Cancel
          </button>
          <button
            onClick={() => {
              sfx.playCoinDrop()
              onConfirmClaim(lead.id)
            }}
            className="inline-flex items-center justify-center gap-2 border-3 border-outline bg-success px-5 py-3 text-xs font-black uppercase shadow-brutal-sm"
          >
            <CheckCircle2 size={17} /> Mark contacted
          </button>
        </div>
    </AccessibleDialog>
  )
}
