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
      panelClassName="relative w-full max-w-2xl space-y-4 border-8 border-outline bg-canvas p-4 text-ink shadow-brutal sm:space-y-6 sm:p-6 md:p-8"
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
    >
        <button
          onClick={onClose}
          aria-label="Close confirmation"
          className="absolute right-4 top-4 border border-outline bg-card p-2 shadow-brutal-sm rounded-xl"
        >
          <X className="h-5 w-5 stroke-[4px]" />
        </button>

        <div className="border border-outline bg-forest p-4 pr-16 text-white shadow-brutal rounded-xl">
          <h2 id="quick-strike-dialog-title" className="text-2xl font-semibold normal-case text-accent">Save this lead to Follow-ups?</h2>
          <p className="mt-1 text-xs font-bold text-ink-muted">It moves to your Follow-ups page. Nothing is posted or sent.</p>
        </div>

        <div className="border border-outline bg-card p-5 shadow-brutal rounded-xl">
          <p className="text-xs font-semibold normal-case text-ink-muted">The post</p>
          <p className="mt-2 text-sm font-bold leading-relaxed text-ink">&quot;{lead.content}&quot;</p>
          <p className="mt-3 text-xs font-bold text-ink-muted">Author: {lead.author} · Platform: {lead.platform}</p>
        </div>

        <div id="quick-strike-dialog-description" className="border border-outline bg-highlight p-4 text-sm font-bold leading-relaxed rounded-xl">
          SEOlaQuest does not contact anyone for you. If you want to reply, use “Draft a reply”, then reply to the person on X
          yourself. Afterwards, record it on the Follow-ups page.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="border border-outline bg-card px-5 py-3 text-xs font-semibold normal-case shadow-brutal-sm rounded-xl">
            Cancel
          </button>
          <button
            onClick={() => {
              sfx.playCoinDrop()
              onConfirmClaim(lead.id)
            }}
            className="inline-flex items-center justify-center gap-2 border border-outline bg-success px-5 py-3 text-xs font-semibold normal-case shadow-brutal-sm rounded-xl"
          >
            <CheckCircle2 size={17} /> Save to follow-ups
          </button>
        </div>
    </AccessibleDialog>
  )
}
