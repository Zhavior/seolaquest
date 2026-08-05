/**
 * Single source of truth for the theme system.
 *
 * The palettes themselves live in `app/globals.css` under `[data-theme="…"]`
 * selectors; this file only owns the *names*, so the pre-paint inline script
 * (ThemeScript) and the React provider can never disagree about what a valid
 * theme is.
 */

export const THEMES = ['parchment', 'grey', 'blue'] as const

export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'parchment'

/** Kept from the previous grey-mode implementation so saved prefs survive. */
export const THEME_STORAGE_KEY = 'coquest_theme'

export const THEME_META: Record<Theme, { label: string; short: string; swatch: string }> = {
  parchment: { label: 'Parchment (light)', short: 'LIGHT', swatch: '#F4F0EA' },
  grey: { label: 'Grey Mode (dark)', short: 'GREY', swatch: '#161B22' },
  blue: { label: 'Midnight Blue (dark)', short: 'BLUE', swatch: '#0A1128' },
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}
