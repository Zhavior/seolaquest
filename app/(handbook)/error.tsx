'use client'

import { useEffect } from 'react'
import { HandbookPage } from '@/features/handbook/components/primitives'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Public route failed', { digest: error.digest })
  }, [error])

  return (
    <HandbookPage volume="errata" title="Error" note="SEOlaQuest could not load this page.">
      <div className="hb-stack" style={{ '--gap': '1.6rem' } as React.CSSProperties}>
        <p>
          <span className="hb-slip">ERRATA</span>
        </p>
        <p className="hb-lede">Something went wrong.</p>
        <p className="hb-prose">Retry the page. If the problem continues, share the reference below with support.</p>
        {error.digest ? <p className="hb-mono">Reference: {error.digest}</p> : null}
        <p>
          <button type="button" className="hb-btn" onClick={reset}>
            Try again
          </button>
        </p>
      </div>
    </HandbookPage>
  )
}
