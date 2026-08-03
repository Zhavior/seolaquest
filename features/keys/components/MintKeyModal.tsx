'use client'

import { KeyRound, X } from 'lucide-react'
import AccessibleDialog from '@/components/AccessibleDialog'
import { ApiRune } from '../types'

interface MintKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onMint: (newRune: ApiRune) => void
}

export default function MintKeyModal({ isOpen, onClose }: MintKeyModalProps) {
  return (
    <AccessibleDialog
      open={isOpen}
      onClose={onClose}
      labelledBy="mint-key-dialog-title"
      describedBy="mint-key-dialog-description"
      panelClassName="relative w-full max-w-lg border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000]"
    >
        <button onClick={onClose} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center border-2 border-black bg-white" aria-label="Close key dialog">
          <X className="h-5 w-5" />
        </button>
        <KeyRound className="h-9 w-9 text-[#FF5722]" />
        <h2 id="mint-key-dialog-title" className="mt-4 text-2xl font-black uppercase">Key creation unavailable</h2>
        <p id="mint-key-dialog-description" className="mt-3 font-bold text-gray-700">
          No credential was created. Key minting remains disabled until server-side hashing, authorization, rotation, revocation,
          and audit controls are implemented and tested.
        </p>
        <button onClick={onClose} className="mt-6 min-h-11 border-4 border-black bg-[#FFE600] px-5 py-3 font-black uppercase shadow-[4px_4px_0_0_#000]">
          Close
        </button>
    </AccessibleDialog>
  )
}
