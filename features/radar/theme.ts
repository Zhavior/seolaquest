/**
 * Canvas-only tokens for the radar simulator.
 *
 * Everything that can be a class *is* a class: the page uses the shared
 * semantic utilities from `app/globals.css` (`bg-canvas`, `border-outline`,
 * `shadow-brutal`, `bg-accent`…) so it themes with the rest of the site instead
 * of pinning its own palette. What lives here is only the handful of values the
 * two `<canvas>` layers need, because a Tailwind class is no help to `ctx`.
 */

/** Ambient pixel drift, matching the landing page's field on the parchment. */
export const PARTICLE_COLORS = [
  'rgba(0, 0, 0, 0.10)',
  'rgba(0, 0, 0, 0.06)',
  'rgba(255, 87, 34, 0.22)',
  'rgba(255, 230, 0, 0.32)',
] as const

/** The scope stays a dark instrument well, as the live console does. */
export const SCOPE_WELL = '#0A0A0A'
export const SCOPE_SWEEP = '#00FF66'
export const SCOPE_LOCK = '#FFE600'
