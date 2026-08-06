'use client'

import { useEffect } from 'react'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep customer output generic. The digest is the safe support reference.
    console.error('SEOlaQuest app route failed', { digest: error.digest })
  }, [error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas p-6">
      <section className="max-w-xl border-4 border-outline bg-card p-8 shadow-brutal-lg">
        <p className="text-xs font-black uppercase text-ink-muted">SEOlaQuest could not load this page</p>
        <h1 className="mt-3 text-3xl font-black uppercase">Your saved work is still the source of truth.</h1>
        <p className="mt-4 font-bold text-ink-muted">Retry the page. If the problem continues, share the reference below with support.</p>
        {error.digest && <p className="mt-4 border-2 border-outline bg-inset p-3 font-mono text-xs">Reference: {error.digest}</p>}
        <button type="button" onClick={reset} className="mt-6 border-4 border-outline bg-accent px-5 py-3 font-black uppercase shadow-brutal">Try again</button>
      </section>
    </div>
  )
}
