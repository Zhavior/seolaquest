'use client'

import { useRef, useState, useTransition } from 'react'
import { useReverification } from '@clerk/nextjs'
import { Flame, Skull, AlertOctagon, X, RefreshCw } from 'lucide-react'
import AccessibleDialog from '@/components/AccessibleDialog'
import { sfx } from '@/lib/sfx'
import { deleteAccountAction } from '@/features/profile/actions'
import { ACCOUNT_DELETION_CONFIRMATION } from '@/src/modules/lifecycle/domain/accountDeletionConstants'

interface DangerZoneCardProps {
  onSuccessToast: (msg: string) => void
}

export default function DangerZoneCard({ onSuccessToast }: DangerZoneCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const confirmationInputRef = useRef<HTMLInputElement>(null)
  const deleteAccount = useReverification(deleteAccountAction)

  function handlePurgeCache() {
    sfx.playCriticalWarning()
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
    onSuccessToast('GUILD CACHE & AUDIO FLAGS PURGED 🧹')
  }

  function handleDeleteAccount() {
    if (confirmInput !== ACCOUNT_DELETION_CONFIRMATION) {
      sfx.playCriticalWarning()
      setError(`Please type "${ACCOUNT_DELETION_CONFIRMATION}" exactly to confirm.`)
      return
    }

    setError('')
    startTransition(async () => {
      try {
        const res = await deleteAccount(confirmInput)
        sfx.playCriticalWarning()
        if (res.ok) {
          onSuccessToast(res.message ?? 'IDENTITY DELETION ACCEPTED. LOCAL REMOVAL IS PENDING.')
          setShowConfirmModal(false)
          setConfirmInput('')
        } else {
          setError(res.message ?? 'Account deletion was not accepted.')
        }
      } catch {
        sfx.playCriticalWarning()
        setError('Account deletion was cancelled or could not be verified.')
      }
    })
  }

  function closeConfirmation() {
    if (pending) return
    sfx.playHoverBlip()
    setShowConfirmModal(false)
    setConfirmInput('')
    setError('')
  }

  return (
    <>
      <section className="border-4 border-black bg-white shadow-[7px_7px_0_0_#000] overflow-hidden">
        <div className="border-b-4 border-black bg-[#FF5722] p-4 flex items-center gap-3">
          <Skull className="text-white" size={28} />
          <h2 className="text-2xl font-black uppercase text-white tracking-tight">Danger Zone</h2>
        </div>
        <div className="p-6 bg-[#F4F0EA] space-y-4">
          <p className="text-xs font-black uppercase text-gray-700">
            Irreversible actions and local cache operations. Use with caution.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Purge Local Cache */}
            <button
              type="button"
              onClick={handlePurgeCache}
              className="flex-1 flex items-center justify-center gap-2 border-3 border-black bg-[#FFE600] px-4 py-3 font-black uppercase text-sm text-black shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              <RefreshCw size={18} /> Purge Guild Cache
            </button>

            {/* Delete Account */}
            <button
              type="button"
              onClick={() => {
                sfx.playHoverBlip()
                setShowConfirmModal(true)
              }}
              className="flex-1 flex items-center justify-center gap-2 border-3 border-black bg-[#FF5722] px-4 py-3 font-black uppercase text-sm text-white shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              <Skull size={18} /> Delete Account
            </button>
          </div>
        </div>
      </section>

      {/* Double Confirmation Modal */}
      <AccessibleDialog
        open={showConfirmModal}
        onClose={closeConfirmation}
        labelledBy="delete-account-dialog-title"
        describedBy="delete-account-dialog-description"
        initialFocusRef={confirmationInputRef}
        closeOnBackdrop={!pending}
        closeOnEscape={!pending}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        panelClassName="flex w-full max-w-lg flex-col border-4 border-black bg-white shadow-[10px_10px_0_0_#000]"
      >
            <header className="flex items-start justify-between gap-3 border-b-4 border-black bg-[#FF5722] p-4 sm:items-center sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <AlertOctagon className="text-white" size={32} />
                <div>
                  <h3 id="delete-account-dialog-title" className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">CONFIRM ACCOUNT DELETION</h3>
                  <p className="text-xs font-bold uppercase text-white/90">Critical Warning: Irreversible Operation</p>
                </div>
              </div>
              <button
                onClick={closeConfirmation}
                disabled={pending}
                aria-label="Close account deletion confirmation"
                className="border-3 border-black bg-white p-2 text-black hover:bg-[#FFE600] transition-colors shadow-[3px_3px_0_0_#000]"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-4 bg-[#F4F0EA] p-4 sm:p-6">
              <div className="border-3 border-black bg-[#FF5722]/10 p-4 border-dashed">
                <p id="delete-account-dialog-description" className="text-sm font-black uppercase text-[#FF5722] leading-relaxed">
                  ⚠️ Warning: This permanently deletes your Clerk identity, sessions, and memberships. Local account data is removed asynchronously after a verified Clerk lifecycle event.
                </p>
              </div>

              {error && (
                <div className="border-2 border-black bg-[#FF5722] p-3 text-xs font-black uppercase text-white">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-gray-800 mb-2">
                  To confirm, type <span className="text-black bg-[#FFE600] px-1 border border-black font-black">{ACCOUNT_DELETION_CONFIRMATION}</span> below:
                </label>
                <input
                  ref={confirmationInputRef}
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={ACCOUNT_DELETION_CONFIRMATION}
                  className="w-full border-3 border-black bg-white p-3 font-black text-black uppercase focus:outline-none focus:ring-4 focus:ring-black"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeConfirmation}
                  disabled={pending}
                  className="border-3 border-black bg-white px-5 py-2.5 font-black uppercase text-sm shadow-[3px_3px_0_0_#000]"
                >
                  ABORT OPERATION
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={pending}
                  className="flex items-center gap-2 border-3 border-black bg-[#FF5722] px-6 py-2.5 font-black uppercase text-sm text-white shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
                >
                  <Flame size={18} />
                  {pending ? 'REQUESTING DELETION…' : 'DELETE ACCOUNT 💀'}
                </button>
              </div>
            </div>
      </AccessibleDialog>
    </>
  )
}
