import Link from 'next/link'
import type { ReactNode } from 'react'
import '../handbook.css'
import '../dusk.css'
import { handbookFontVariables } from '../fonts'
import { HandbookMark } from '../components/HandbookMark'

/**
 * Re-skins the tutorial quest without touching its logic. The form is written
 * against semantic tokens (bg-canvas, border-outline, text-ink...), so the
 * `.hb-skin` scope in handbook.css redefines those tokens (and the type and
 * corner variables) for this subtree only. The signed-in product keeps its own
 * themes.
 */
export function OnboardingSkin({ children }: { children: ReactNode }) {
  return (
    <div className={`hb hb-skin ${handbookFontVariables}`}>
      <header className="hb-top hb-frame">
        <Link href="/" className="hb-mark" aria-label="SEOlaQuest home">
          <HandbookMark />
          <span className="hb-mark-word">SEOlaQuest</span>
        </Link>
        <p className="hb-mono" style={{ color: '#D9D0EC' }}>
          Tutorial quest
        </p>
      </header>
      <div className="hb-skin-body">{children}</div>
    </div>
  )
}
