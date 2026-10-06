import Link from 'next/link'
import { Icon } from '../artifact/IconSprite'

/** The wordmark: the engraved crest and the name in Cinzel. */
export function Brand({ size = 34 }: { size?: number }) {
  return (
    <Link href="/" className="hb-brand" aria-label="SEOlaQuest home">
      <Icon name="crest" size={size} />
      <span className="hb-brand-word">SEOLAQUEST</span>
    </Link>
  )
}
