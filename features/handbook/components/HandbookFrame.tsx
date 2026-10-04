import Link from 'next/link'
import type { ReactNode } from 'react'
import '../handbook.css'
import { handbookFontVariables } from '../fonts'
import { HandbookFooter } from './HandbookFooter'
import { HandbookMark } from './HandbookMark'
import { TabRail } from './TabRail'

/**
 * The desk the handbook lies on: a dark frame (top strip and fore-edge rail)
 * around whichever colour board is open. The frame never changes; only the
 * board and the current tab do. Renders the page's single `main` landmark.
 */
export function HandbookFrame({ children }: { children: ReactNode }) {
  return (
    <div className={`hb ${handbookFontVariables}`}>
      <header className="hb-top hb-frame">
        <Link href="/" className="hb-mark" aria-label="SEOlaQuest home">
          <HandbookMark />
          <span className="hb-mark-word">SEOlaQuest</span>
        </Link>
        <nav className="hb-top-actions" aria-label="Account">
          <Link href="/sign-in" className="hb-top-link">
            Sign in
          </Link>
          <Link href="/sign-up" className="hb-top-cta">
            Start free
          </Link>
        </nav>
      </header>
      <TabRail />
      <div className="hb-book">
        <main>{children}</main>
        <HandbookFooter />
      </div>
    </div>
  )
}
