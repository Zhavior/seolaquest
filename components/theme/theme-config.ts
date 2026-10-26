/**
 * Single source of truth for the theme system.
 *
 * The signed-in app and the public site share one look — Dusk, the landing
 * page's night-violet and old-gold palette — so there is one theme. The
 * palette lives in `app/globals.css` under `[data-theme="dusk"]`; this file
 * only owns the name, so the pre-paint inline script (ThemeScript) and the
 * React provider can never disagree about what a valid theme is.
 *
 * A saved choice from the old picker (parchment, grey, blue) is not a valid
 * theme any more, so ThemeScript falls back to Dusk for it.
 */

export const THEMES = ['dusk'] as const

export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'dusk'

/** Kept from the previous grey-mode implementation so saved prefs survive. */
export const THEME_STORAGE_KEY = 'coquest_theme'

export const THEME_META: Record<Theme, { label: string; short: string; swatch: string }> = {
  dusk: { label: 'Dusk (dark)', short: 'DUSK', swatch: '#0b0818' },
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}
