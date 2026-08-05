'use client'

import AccessibleDialog from '@/components/AccessibleDialog'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessToast: (message: string) => void
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  return (
    <AccessibleDialog
      open={isOpen}
      onClose={onClose}
      labelledBy="bug-report-dialog-title"
      describedBy="bug-report-dialog-description"
      panelClassName="w-full max-w-lg border-4 border-outline bg-card p-6 shadow-brutal-lg"
    >
        <h2 id="bug-report-dialog-title" className="text-2xl font-black uppercase">Bug submission unavailable</h2>
        <p id="bug-report-dialog-description" className="mt-3 font-bold">No report was sent because a durable support destination is not configured.</p>
        <button onClick={onClose} className="mt-6 border-4 border-outline bg-accent px-5 py-3 font-black uppercase">Close</button>
    </AccessibleDialog>
  )
}
