import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES } from './theme-config'

/**
 * Synchronous inline script rendered into <head>.
 *
 * It runs while the browser is still parsing HTML — before the first paint —
 * so the saved theme is on <html> by the time any pixel is drawn. Deferring
 * this to an effect would repaint after the user has already seen the default
 * theme. See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 *
 * The script body is generated from theme-config so it cannot drift from the
 * provider's idea of a valid theme.
 */
const SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(${JSON.stringify(THEMES)}.indexOf(t)<0)t=${JSON.stringify(
  DEFAULT_THEME,
)};document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
}
