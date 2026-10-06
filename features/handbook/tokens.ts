import type { CSSProperties } from 'react'
import { boardTokens, type BoardTokens } from './leaf'

/**
 * The seven volumes of the handbook. Hue belongs to the volume, never to a
 * state: vermilion is held out of this list on purpose, it only ever appears as
 * an errata slip (error or open known issue).
 */
export const VOLUMES = [
  { id: 'start', label: 'Start', href: '/', hue: '#F2C400', weight: 2 },
  { id: 'hunt', label: 'The Hunt', href: '/#hunt', hue: '#0F8B8D', weight: 2 },
  { id: 'try', label: 'Try it', href: '/radar', hue: '#3E9A3A', weight: 2 },
  { id: 'quests', label: 'Quests', href: '/#quests', hue: '#2B3FA3', weight: 2 },
  { id: 'inventory', label: 'Inventory', href: '/pricing', hue: '#D4571E', weight: 2 },
  { id: 'notes', label: 'Field Notes', href: '/blog', hue: '#8C4A2F', weight: 2 },
  { id: 'errata', label: 'Errata', href: '/status', hue: '#6A3FA0', weight: 2 },
] as const

export type VolumeId = (typeof VOLUMES)[number]['id']

export const VOLUME_BY_ID = Object.fromEntries(VOLUMES.map((volume) => [volume.id, volume])) as Record<
  VolumeId,
  (typeof VOLUMES)[number]
>

/** Reserved for errors and open known issues. Never a volume hue. */
export const ERRATA_VERMILION = '#D42A17'

const cache = new Map<string, BoardTokens>()

export function tokensFor(volume: VolumeId): BoardTokens {
  const hit = cache.get(volume)
  if (hit) return hit
  const solved = boardTokens(VOLUME_BY_ID[volume].hue)
  cache.set(volume, solved)
  return solved
}

/**
 * Inline custom properties that turn any subtree into that volume's board.
 *
 * In the Dusk Hunt look the volume hue is a gem, not a field: `--board` carries
 * it (buttons, studs, meters and glows are cut from it) while the reading panel
 * (`--leaf`) and its gold edge (`--edge`) are the same night-violet and old gold
 * on every page, so contrast never depends on which volume is open.
 */
export function boardStyle(volume: VolumeId): CSSProperties {
  const tokens = tokensFor(volume)
  return {
    '--board': tokens.board,
    '--leaf': DUSK_PANEL,
    '--edge': DUSK_EDGE,
    '--on-board': tokens.onBoard,
  } as CSSProperties
}

export const DUSK_PANEL = '#120E22'
export const DUSK_EDGE = '#5A4720'

/** Which volume owns a pathname, for the rail's current tab on non-home routes. */
export function volumeForPath(pathname: string): VolumeId {
  if (pathname === '/') return 'start'
  if (pathname.startsWith('/radar')) return 'try'
  if (pathname.startsWith('/pricing')) return 'inventory'
  if (pathname.startsWith('/blog')) return 'notes'
  if (pathname.startsWith('/status')) return 'errata'
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return 'start'
  return 'errata'
}
