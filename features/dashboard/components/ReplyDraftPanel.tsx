'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReplyDraft } from '@/features/dashboard/hooks/useDashboardState'

/**
 * The AI draft reply, in a box that stays until closed. The person can edit it,
 * copy it, and open the post to reply themselves. SEOlaQuest never sends it.
 */
export function ReplyDraftPanel({ draft, onClose }: { draft: ReplyDraft; onClose: () => void }) {
  const [text, setText] = useState(draft.text)
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the new box so keyboard and screen-reader users land on it.
  useEffect(() => {
    headingRef.current?.focus()
  }, [draft.leadId])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied('done')
    } catch {
      setCopied('failed')
    }
  }

  return (
    <section
      aria-labelledby="reply-draft-title"
      className="rounded-[20px] border border-outline bg-card p-4 shadow-sm sm:p-5"
    >
      <h3 id="reply-draft-title" ref={headingRef} tabIndex={-1} className="font-display text-xl text-ink focus:outline-none">
        Draft reply to {draft.author}
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        Written by AI. Read it, change anything you like, then copy it and reply on the post yourself. Nothing is sent for you.
      </p>
      <label htmlFor="reply-draft-text" className="sr-only">
        Draft reply
      </label>
      <textarea
        id="reply-draft-text"
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setCopied('idle')
        }}
        rows={4}
        className="mt-3 block w-full rounded-[12px] border border-outline bg-canvas p-3 text-base text-ink focus:outline-none focus:ring-4 focus:ring-accent"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center rounded-[12px] border border-outline bg-accent px-4 text-sm font-semibold text-on-accent"
        >
          Copy reply
        </button>
        <a
          href={draft.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-[12px] border border-outline bg-card px-4 text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          Open the post
        </a>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center rounded-[12px] border border-outline bg-card px-4 text-sm font-semibold text-ink"
        >
          Close
        </button>
        <p role="status" className="text-sm text-ink-muted">
          {copied === 'done' ? 'Copied.' : copied === 'failed' ? 'Could not copy. Select the text and copy it yourself.' : ''}
        </p>
      </div>
    </section>
  )
}
