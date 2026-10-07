import type { Tier } from '../rules'

const TIER_STOPS: Record<Tier, { hi: string; mid: string; lo: string; label: string }> = {
  ENGAGE: { hi: '#FFD2A0', mid: '#FF8A3D', lo: '#8A3A0E', label: 'Legendary' },
  WATCH: { hi: '#B9DDFF', mid: '#5DB2FF', lo: '#1B4F86', label: 'Rare' },
  IGNORE: { hi: '#F1F2F5', mid: '#C9CBD2', lo: '#6B6E7A', label: 'Common' },
}

export const TIER_NAME: Record<Tier, string> = {
  ENGAGE: TIER_STOPS.ENGAGE.label,
  WATCH: TIER_STOPS.WATCH.label,
  IGNORE: TIER_STOPS.IGNORE.label,
}

/**
 * A faceted gem for a lead's rarity. The rarity is the real Aurora tier of the
 * score (80+ engage, 40-79 watch, under 40 ignore), so the colour carries the
 * same meaning here as everywhere else on the site. Decorative: the tier is
 * always also written out next to it.
 */
export function Gem({ tier, size = 28, muted = false }: { tier: Tier; size?: number; muted?: boolean }) {
  const stops = TIER_STOPS[tier]
  const id = `gem-${tier}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      style={{ opacity: muted ? 0.4 : 1, filter: muted ? 'none' : `drop-shadow(0 0 6px ${stops.mid}88)` }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={stops.hi} />
          <stop offset="0.5" stopColor={stops.mid} />
          <stop offset="1" stopColor={stops.lo} />
        </linearGradient>
      </defs>
      <path d="M16 2 28 12 16 30 4 12Z" fill={`url(#${id})`} stroke="#0B0818" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 12h24M10 12 16 2l6 10M10 12l6 18 6-18" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
    </svg>
  )
}
