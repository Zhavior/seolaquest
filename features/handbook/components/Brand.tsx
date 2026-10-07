import Link from 'next/link'
import { Icon } from '../artifact/IconSprite'

/** The wordmark: the engraved crest and the name in the display face. */
export function Brand({ size = 34 }: { size?: number }) {
  return (
    <Link href="/" className="hb-brand" aria-label="SEOlaQuest home">
      <Icon name="crest" size={size} />
      <span className="hb-brand-word">SEOlaQuest</span>
    </Link>
  )
}
