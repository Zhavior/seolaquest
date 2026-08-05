'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * Id of the off-canvas drawer panel. Exported so triggers elsewhere in the
 * shell can point `aria-controls` at it.
 */
export const MOBILE_NAV_ID = 'coquest-mobile-nav'

/** Height of the bottom tray content box, published to CSS as a variable. */
const TRAY_HEIGHT = '4.75rem'

/**
 * StatusBar height (h-16 + 4px border, h-20 + 4px from `sm`) plus the top safe
 * area it pads itself with — the desktop sidebar sticks against the same value.
 */
const TOP_BAR_OFFSET = 'calc(68px + env(safe-area-inset-top, 0px))'
const TOP_BAR_OFFSET_SM = 'calc(84px + env(safe-area-inset-top, 0px))'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export interface MobileAppShellProps {
  /** Mobile-only sticky bar rendered under the StatusBar. */
  header?: ReactNode
  /** Page content. Rendered on every breakpoint. */
  children: ReactNode
  /** Mobile-only fixed bottom navigation / action tray. */
  bottomBar?: ReactNode
  /** Navigation body rendered inside the off-canvas drawer. */
  sidebar?: ReactNode
  /** Drawer open state — owned by CoQuestShell. */
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

/**
 * Mobile presentation layer for the authenticated shell.
 *
 * Composes around the existing desktop shell rather than replacing it: every
 * region it adds is `md:hidden`, and its own box resets to neutral at `md` so
 * the desktop layout is unaffected.
 */
export default function MobileAppShell({
  header,
  children,
  bottomBar,
  sidebar,
  mobileOpen = false,
  onCloseMobile,
}: MobileAppShellProps) {
  const panelRef = useRef<HTMLElement>(null)
  const drawerOpen = mobileOpen && Boolean(sidebar)

  // Escape closes the drawer.
  useEffect(() => {
    if (!drawerOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onCloseMobile?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen, onCloseMobile])

  // Freeze background scrolling while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return
    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = previousOverflow
    }
  }, [drawerOpen])

  // Move focus into the drawer and keep Tab inside it while open.
  useEffect(() => {
    if (!drawerOpen) return
    const panel = panelRef.current
    if (!panel) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    panel.focus()

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => {
      document.removeEventListener('keydown', handleTab)
      previouslyFocused?.focus?.()
    }
  }, [drawerOpen])

  // The drawer is a mobile affordance: crossing into `md` closes it so the
  // desktop layout never inherits a locked body or a hidden content region.
  useEffect(() => {
    if (!drawerOpen) return
    const query = window.matchMedia('(min-width: 48rem)')
    const sync = () => {
      if (query.matches) onCloseMobile?.()
    }
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [drawerOpen, onCloseMobile])

  return (
    <div
      // `overflow-x-clip` rather than `overflow-x-hidden`: `hidden` computes
      // `overflow-y` to `auto`, which would make this a scroll container and
      // break `position: sticky` for the mobile top bar.
      className="relative flex min-h-[100dvh] w-full flex-col overflow-x-clip md:block md:min-h-0 md:overflow-x-visible"
      style={
        {
          '--mobile-tray-height': bottomBar ? TRAY_HEIGHT : '0px',
        } as CSSProperties
      }
    >
      <div className="contents" aria-hidden={drawerOpen || undefined}>
        {header && (
          <div
            className="pt-safe sticky z-40 -mx-4 -mt-4 mb-4 border-b-3 border-black bg-[#FAF7F2]/95 px-4 backdrop-blur-sm md:hidden"
            style={{ top: TOP_BAR_OFFSET }}
          >
            {header}
          </div>
        )}

        {/*
          A plain box, not a `main` landmark: this only supplies the mobile
          safe-area/tray padding. `Workspace` is the single owner of `main`,
          and nesting one inside another is invalid HTML besides duplicating
          the landmark.
        */}
        <div className="w-full min-w-0 flex-1 pb-[calc(env(safe-area-inset-bottom,0px)+var(--mobile-tray-height,0px))] md:pb-0">
          {children}
        </div>

        {bottomBar && (
          <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t-4 border-black bg-white shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] md:hidden">
            <div className="flex h-[var(--mobile-tray-height)] items-center px-3">{bottomBar}</div>
          </div>
        )}
      </div>

      {sidebar && (
        <div
          className={`fixed inset-0 z-[60] md:hidden ${
            drawerOpen ? 'visible' : 'pointer-events-none invisible'
          }`}
          aria-hidden={!drawerOpen || undefined}
        >
          <button
            type="button"
            aria-label="Close navigation"
            tabIndex={drawerOpen ? 0 : -1}
            onClick={onCloseMobile}
            className={`absolute inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-200 ${
              drawerOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <aside
            ref={panelRef}
            id={MOBILE_NAV_ID}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            tabIndex={-1}
            className={`apple-spring pt-safe pb-safe absolute inset-y-0 left-0 flex h-[100dvh] w-[88vw] max-w-[320px] flex-col overflow-y-auto border-r-4 border-black bg-white shadow-[10px_0_0_rgba(0,0,0,0.25)] transition-transform duration-300 ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {sidebar}
          </aside>
        </div>
      )}
    </div>
  )
}
