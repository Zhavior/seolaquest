'use client'

import { useEffect } from 'react'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep customer output generic. The digest is the safe support reference.
    console.error('SEOlaQuest app route failed', { digest: error.digest })
  }, [error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas p-6">
      <section className="max-w-xl border border-outline bg-card p-8 shadow-brutal-lg rounded-xl">
        <p className="text-xs font-semibold normal-case text-ink-muted">SEOlaQuest could not load this page</p>
        <h1 className="mt-3 text-3xl font-semibold normal-case">Your saved work is still the source of truth.</h1>
        <p className="mt-4 font-bold text-ink-muted">Retry the page. If the problem continues, share the reference below with support.</p>
        {error.digest && <p className="mt-4 border border-outline bg-inset p-3 font-mono text-xs rounded-xl">Reference: {error.digest}</p>}
        <button type="button" onClick={reset} className="mt-6 border border-outline bg-accent px-5 py-3 font-semibold normal-case shadow-brutal rounded-xl">Try again</button>
      </section>
    </div>
  )
}
