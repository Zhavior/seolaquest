'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { DEFAULT_THEME, THEME_STORAGE_KEY, isTheme, type Theme } from './theme-config'

interface ThemeContextValue {
  theme: Theme
  setTheme: (next: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// We need to read the DOM *before* paint; useEffect lands after it. On the
// server neither runs, and React warns about useLayoutEffect during SSR, so
// swap it out there.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function applyTheme(next: Theme): void {
  const root = document.documentElement
  // Suppress transitions for one frame — without this, every transitioning
  // element cross-fades on its own schedule and the swap looks like a smear.
  root.setAttribute('data-theme-switching', '')
  root.setAttribute('data-theme', next)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.removeAttribute('data-theme-switching'))
  })
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Starts at DEFAULT_THEME on both the server and the first client render so
  // hydration matches. ThemeScript has already painted the correct colours;
  // only the toggle's own indicator needs catching up, which happens below
  // before paint.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  useIsomorphicLayoutEffect(() => {
    const fromDom = document.documentElement.getAttribute('data-theme')
    if (isTheme(fromDom)) {
      setThemeState((current) => (current === fromDom ? current : fromDom))
    }
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Private mode / storage disabled — the theme still applies this session.
    }
  }, [])

  // Keep open tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY || !isTheme(event.newValue)) return
      setThemeState(event.newValue)
      applyTheme(event.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}
