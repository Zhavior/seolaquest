'use client'

import AccessibleDialog from '@/components/AccessibleDialog'

interface FeedbackScrollModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessToast: (message: string) => void
}

export default function FeedbackScrollModal({ isOpen, onClose }: FeedbackScrollModalProps) {
  return (
    <AccessibleDialog
      open={isOpen}
      onClose={onClose}
      labelledBy="feedback-scroll-dialog-title"
      describedBy="feedback-scroll-dialog-description"
      panelClassName="w-full max-w-lg rounded-[20px] border border-outline bg-card p-6 shadow-sm"
    >
        <h2 id="feedback-scroll-dialog-title" className="font-display text-2xl font-semibold normal-case">Feedback submission unavailable</h2>
        <p id="feedback-scroll-dialog-description" className="mt-3 font-medium">No feedback was sent because a durable destination is not configured.</p>
        <button onClick={onClose} className="mt-6 rounded-[20px] border border-outline bg-accent px-5 py-3 font-semibold normal-case">Close</button>
    </AccessibleDialog>
  )
}
