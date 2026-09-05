'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { SampleTarget } from '../data/sample-targets'

/** Matches the exit transition on the overlay and the panel. */
const EXIT_MS = 180

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

type Props = {
  open: boolean
  target: SampleTarget
  draft: string
  draftLabel: string
  copied: boolean
  onCopy: () => void
  onClose: () => void
  reducedMotion: boolean
}

/**
 * Modal dialog with the four behaviours a modal has to have and that a plain
 * absolutely-positioned panel does not: focus moves in on open and returns to
 * the invoking control on close, Tab is trapped inside, Escape closes, and the
 * page behind it stops scrolling.
 */
export function ReplyDrawer({
  open,
  target,
  draft,
  draftLabel,
  copied,
  onCopy,
  onClose,
  reducedMotion,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  // `rendered` outlives `open` so the panel can animate out before unmounting.
  const [rendered, setRendered] = useState(open)
  const [leaving, setLeaving] = useState(false)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      restoreFocusRef.current?.focus()
    }
  }, [open, onClose])

  /**
   * The exit fade `AnimatePresence` used to own, as plain state: the panel
   * stays mounted for the length of the transition, then unmounts. Every write
   * happens in a timer callback rather than in the effect body, which is what
   * `react-hooks/set-state-in-effect` is asking for — and it also gives the
   * browser a frame to paint the entering state before the class flips.
   *
   * Reduced motion unmounts on the next tick instead of sitting on a
   * closed-but-visible dialog for 180ms.
   */
  useEffect(() => {
    if (open) {
      const enter = setTimeout(() => {
        setRendered(true)
        setLeaving(false)
      }, 0)
      return () => clearTimeout(enter)
    }

    if (!rendered) return

    if (reducedMotion) {
      const now = setTimeout(() => setRendered(false), 0)
      return () => clearTimeout(now)
    }

    const start = setTimeout(() => setLeaving(true), 0)
    const done = setTimeout(() => setRendered(false), EXIT_MS)
    return () => {
      clearTimeout(start)
      clearTimeout(done)
    }
  }, [open, rendered, reducedMotion])

  if (!rendered) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity duration-[180ms] motion-reduce:transition-none',
        leaving ? 'opacity-0' : 'opacity-100 motion-safe:animate-[radar-fade_0.18s_ease-out_both]',
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reply-drawer-title"
        className={cn(
          'transition-[opacity,transform] duration-[180ms] motion-reduce:transition-none',
          leaving && 'translate-y-2 opacity-0',
          !reducedMotion && !leaving && 'motion-safe:animate-[radar-rise_0.18s_ease-out_both]',
          'max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-outline bg-card text-ink shadow-brutal rounded-xl',
        )}
      >
            <div className="flex items-center justify-between gap-3 border-b border-outline bg-accent px-4 py-3">
              <h2
                id="reply-drawer-title"
                className="flex items-center gap-2 font-mono text-xs font-semibold normal-case tracking-[0.18em] text-on-accent"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span>{draftLabel} · sample thread</span>
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center border border-outline bg-card text-ink shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none rounded-xl"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close dialog</span>
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="space-y-2 border border-outline bg-inset p-4 rounded-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                  <span className="font-semibold text-ink">
                    {target.handle} · {target.source}
                  </span>
                  <span className="border border-outline bg-highlight px-2 py-0.5 font-semibold normal-case tracking-[0.12em] text-on-accent rounded-xl">
                    Demo score {target.intentScore}
                  </span>
                </div>
                <p className="text-sm italic text-ink">&ldquo;{target.body}&rdquo;</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-mono text-[10px] font-semibold normal-case tracking-[0.18em] text-ink-muted">{draftLabel}</h3>
                <pre className="overflow-x-auto whitespace-pre-wrap border border-outline bg-inset p-4 font-mono text-xs leading-relaxed text-ink rounded-xl">
                  {draft}
                </pre>
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <button
                  type="button"
                  onClick={onCopy}
                  className="flex flex-1 items-center justify-center gap-2 border border-outline bg-accent py-3 font-mono text-[11px] font-semibold normal-case tracking-[0.18em] text-on-accent shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none rounded-xl"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      <span>Copy to clipboard</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-outline bg-ink px-6 py-3 font-mono text-[11px] font-semibold normal-case tracking-[0.18em] text-ink-inverse shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none rounded-xl"
                >
                  Close
                </button>
              </div>
              <p aria-live="polite" className="sr-only">
                {copied ? 'Draft copied to clipboard.' : ''}
              </p>
            </div>
      </div>
    </div>
  )
}
