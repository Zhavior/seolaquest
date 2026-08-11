'use client'

import { useState } from 'react'
import { Copy, Check, Terminal } from 'lucide-react'
import { sfx } from '@/lib/sfx'

interface BlogCodeBlockProps {
  language?: string
  code: string
}

export function BlogCodeBlock({ language = 'code', code }: BlogCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    sfx.playCoinDrop()
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback copy failed
    }
  }

  return (
    <div className="my-6 border-4 border-outline bg-[#121212] shadow-brutal-lg overflow-hidden">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b-4 border-outline bg-zinc-900 px-4 py-2 text-xs font-black uppercase text-white">
        <div className="flex items-center gap-2 text-[#00FFFF]">
          <Terminal size={14} />
          <span>{language}</span>
        </div>

        <button
          type="button"
          onMouseEnter={() => sfx.playHoverBlip()}
          onClick={handleCopy}
          className="flex items-center gap-1 border-2 border-outline bg-accent px-2.5 py-1 text-[11px] font-black uppercase text-on-accent shadow-brutal-sm hover:bg-[#00FFFF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          {copied ? (
            <>
              <Check size={12} strokeWidth={3} className="text-ink" /> COPIED
            </>
          ) : (
            <>
              <Copy size={12} strokeWidth={3} /> COPY
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      {/* tabIndex + role make the horizontal scroll reachable without a mouse.
          axe flags an overflow container that keyboard users cannot enter
          (scrollable-region-focusable), and long code lines are exactly the
          case where that matters. */}
      <pre
        tabIndex={0}
        role="region"
        aria-label={`${language} code sample`}
        className="p-4 overflow-x-auto font-mono text-xs md:text-sm text-[#A3E635] leading-relaxed selection:bg-accent selection:text-on-accent"
      >
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}
