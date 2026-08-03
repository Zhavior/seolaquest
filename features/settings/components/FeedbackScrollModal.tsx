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
      panelClassName="w-full max-w-lg border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
    >
        <h2 id="feedback-scroll-dialog-title" className="text-2xl font-black uppercase">Feedback submission unavailable</h2>
        <p id="feedback-scroll-dialog-description" className="mt-3 font-bold">No feedback was sent because a durable destination is not configured.</p>
        <button onClick={onClose} className="mt-6 border-4 border-black bg-[#FFE600] px-5 py-3 font-black uppercase">Close</button>
    </AccessibleDialog>
  )
}
