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
      panelClassName="w-full max-w-lg rounded-[20px] border border-outline bg-card p-6 shadow-sm"
    >
        <h2 id="bug-report-dialog-title" className="font-display text-2xl font-semibold normal-case">Bug submission unavailable</h2>
        <p id="bug-report-dialog-description" className="mt-3 font-medium">No report was sent because a durable support destination is not configured.</p>
        <button onClick={onClose} className="mt-6 rounded-[20px] border border-outline bg-accent px-5 py-3 font-semibold normal-case">Close</button>
    </AccessibleDialog>
  )
}
