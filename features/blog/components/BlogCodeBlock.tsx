'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface BlogCodeBlockProps {
  language?: string
  code: string
}

export function BlogCodeBlock({ language = 'code', code }: BlogCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused; the code stays selectable by hand.
    }
  }

  return (
    <div className="hb-codeblock">
      <div className="hb-codeblock-bar">
        <span className="hb-mono">{language}</span>
        <button type="button" className="hb-codeblock-copy" onClick={handleCopy}>
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {/* tabIndex + role make the horizontal scroll reachable without a mouse.
          axe flags an overflow container that keyboard users cannot enter
          (scrollable-region-focusable), and long code lines are exactly the
          case where that matters. */}
      <pre tabIndex={0} role="region" aria-label={`${language} code sample`}>
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}
