'use client'

import { useState, useEffect, useCallback, useSyncExternalStore, type ReactNode } from 'react'

import dynamic from 'next/dynamic'

import ShellLayout from './layout/ShellLayout'
import MobileAppShell from './mobile/MobileAppShell'
import MobileBottomNav from './mobile/MobileBottomNav'
import Sidebar, { SidebarNavigation } from './sidebar/Sidebar'
import StatusBar from './statusbar/StatusBar'
import Workspace from './workspace/Workspace'
import { sfx } from '@/lib/sfx'

/**
 * The palette renders `null` until Cmd/Ctrl+K opens it, so it contributes
 * nothing above the fold. Loading it as its own client chunk keeps it — and the
 * whole navigation index it closes over — out of the shell's critical path.
 */
const CommandPalette = dynamic(() => import('../os/palette/CommandPalette'), { ssr: false })

const COLLAPSED_KEY = 'coquest_sidebar_collapsed'

/**
 * The collapsed rail preference is external state that lives in localStorage,
 * so it is read through `useSyncExternalStore` rather than mirrored into React
 * state.
 *
 * This is what keeps hydration honest: the server has no localStorage, so it
 * renders `getServerSnapshot()` (expanded), and React switches to the stored
 * value straight after hydrating instead of reporting a mismatch. Seeding
 * `useState` from localStorage — which is what this used to do — made the very
 * first client render disagree with the server's HTML.
 */
/** Fallback for browsers that refuse storage, so the rail still toggles. */
let collapsedInMemory = false

const collapsedStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    collapsedStore.listeners.add(listener)
    return () => {
      collapsedStore.listeners.delete(listener)
    }
  },
  getSnapshot() {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true'
    } catch {
      return collapsedInMemory
    }
  },
  getServerSnapshot() {
    return false
  },
  set(next: boolean) {
    collapsedInMemory = next
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next))
    } catch {
      // Ignore storage errors — the in-memory value carries this session.
    }
    collapsedStore.listeners.forEach((listener) => listener())
  },
}

interface SEOlaQuestShellProps {
  /**
   * Server-rendered HUD (`ShellHud`), handed straight to the status bar. Taking
   * it as a slot is what keeps the account record on the server.
   */
  hud?: ReactNode
  isAdmin?: boolean
  children: ReactNode
}

export default function SEOlaQuestShell({
  hud,
  isAdmin = false,
  children,
}: SEOlaQuestShellProps) {
  const collapsed = useSyncExternalStore(
    collapsedStore.subscribe,
    collapsedStore.getSnapshot,
    collapsedStore.getServerSnapshot
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  const openMobile = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const toggleCollapsed = useCallback(() => {
    const next = !collapsedStore.getSnapshot()
    if (next) {
      sfx.playSidebarCollapse()
    } else {
      sfx.playSidebarExpand()
    }
    collapsedStore.set(next)
  }, [])

  // Keyboard shortcut listener (Cmd+B or Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleCollapsed])

  return (
    <ShellLayout
      collapsed={collapsed}
      sidebar={
        // Desktop rail only — the mobile drawer is owned by MobileAppShell.
        <Sidebar isAdmin={isAdmin} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      }
      statusBar={
        <StatusBar
          hud={hud}
          collapsed={collapsed}
          onOpenNavigation={openMobile}
          onToggleCollapsed={toggleCollapsed}
        />
      }
    >
      <CommandPalette />
      <MobileAppShell
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
        sidebar={<SidebarNavigation isAdmin={isAdmin} mobile onNavigate={closeMobile} />}
        bottomBar={<MobileBottomNav mobileOpen={mobileOpen} onOpenNavigation={openMobile} />}
      >
        <Workspace>{children}</Workspace>
      </MobileAppShell>
    </ShellLayout>
  )
}
