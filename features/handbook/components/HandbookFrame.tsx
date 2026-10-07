import type { ReactNode } from 'react'
import '../handbook.css'
import '../dusk.css'
import '../artifact.css'
import { IconSprite } from '../artifact/IconSprite'
import { handbookFontVariables } from '../fonts'
import { HandbookFooter } from './HandbookFooter'
import { SiteHeader } from './SiteHeader'

/**
 * The frame every public page shares: the painted dusk sky, the fixed top bar,
 * the page, and the footer. The home page lays a live 3D valley over the
 * painted sky; every other page keeps the painted sky. Renders the page's
 * single `main` landmark.
 */
export function HandbookFrame({ children }: { children: ReactNode }) {
  return (
    <div className={`hb ${handbookFontVariables}`}>
      <IconSprite />
      <div className="hb-sky" aria-hidden="true" />
      <SiteHeader />
      <div className="hb-book">
        <main>{children}</main>
        <HandbookFooter />
      </div>
    </div>
  )
}
