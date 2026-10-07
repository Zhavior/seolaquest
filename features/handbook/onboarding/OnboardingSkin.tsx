import type { ReactNode } from 'react'
import '../handbook.css'
import '../dusk.css'
import '../artifact.css'
import { handbookFontVariables } from '../fonts'
import { Brand } from '../components/Brand'
import { IconSprite } from '../artifact/IconSprite'

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
      <IconSprite />
      <header className="hb-top hb-frame">
        <Brand />
        <p className="hb-mono" style={{ color: '#D9D0EC' }}>
          Tutorial quest
        </p>
      </header>
      <div className="hb-skin-body">{children}</div>
    </div>
  )
}
