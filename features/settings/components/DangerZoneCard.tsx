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
      <section className="rounded-[20px] border border-outline bg-card shadow-sm overflow-hidden">
        <div className="border-b border-outline bg-accent-2 p-4 flex items-center gap-3">
          <Skull className="text-on-accent" size={28} />
          <h2 className="font-display text-2xl font-semibold normal-case text-on-accent tracking-tight">Danger Zone</h2>
        </div>
        <div className="p-6 bg-canvas space-y-4">
          <p className="text-xs font-semibold normal-case text-ink-muted">
            Irreversible actions and local cache operations. Use with caution.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Purge Local Cache */}
            <button
              type="button"
              onClick={handlePurgeCache}
              className="flex-1 flex items-center justify-center gap-2 rounded-[20px] border border-outline bg-accent px-4 py-3 font-semibold normal-case text-sm text-on-accent shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
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
              className="flex-1 flex items-center justify-center gap-2 rounded-[20px] border border-outline bg-accent-2 px-4 py-3 font-semibold normal-case text-sm text-on-accent shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
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
        panelClassName="flex w-full max-w-lg flex-col rounded-[20px] border border-outline bg-card shadow-sm"
      >
            <header className="flex items-start justify-between gap-3 border-b border-outline bg-accent-2 p-4 sm:items-center sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <AlertOctagon className="text-on-accent" size={32} />
                <div>
                  <h3 id="delete-account-dialog-title" className="font-display text-xl font-semibold normal-case tracking-tight text-on-accent sm:text-2xl">CONFIRM ACCOUNT DELETION</h3>
                  <p className="text-xs font-medium normal-case text-on-accent/90">Critical Warning: Irreversible Operation</p>
                </div>
              </div>
              <button
                onClick={closeConfirmation}
                disabled={pending}
                aria-label="Close account deletion confirmation"
                className="rounded-[20px] border border-outline bg-card p-2 text-ink hover:bg-accent transition-colors shadow-none"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-4 bg-canvas p-4 sm:p-6">
              <div className="rounded-[20px] border border-outline bg-accent-2/10 p-4 border-dashed">
                <p id="delete-account-dialog-description" className="text-sm font-semibold normal-case text-accent leading-relaxed">
                  ⚠️ Warning: This permanently deletes your Clerk identity, sessions, and memberships. Local account data is removed asynchronously after a verified Clerk lifecycle event.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-outline bg-accent-2 p-3 text-xs font-semibold normal-case text-on-accent">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold normal-case text-ink mb-2">
                  To confirm, type <span className="text-on-accent bg-accent px-1 border border-outline font-semibold">{ACCOUNT_DELETION_CONFIRMATION}</span> below:
                </label>
                <input
                  ref={confirmationInputRef}
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={ACCOUNT_DELETION_CONFIRMATION}
                  className="w-full rounded-[20px] border border-outline bg-card p-3 font-semibold text-ink normal-case focus:outline-none focus:ring-4 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeConfirmation}
                  disabled={pending}
                  className="rounded-[20px] border border-outline bg-card px-5 py-2.5 font-semibold normal-case text-sm shadow-none"
                >
                  ABORT OPERATION
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={pending}
                  className="flex items-center gap-2 rounded-[20px] border border-outline bg-accent-2 px-6 py-2.5 font-semibold normal-case text-sm text-on-accent shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
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
