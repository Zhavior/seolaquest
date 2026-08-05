'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { Menu } from 'lucide-react'

import CommandPalette from '../os/palette/CommandPalette'
import ShellLayout from './layout/ShellLayout'
import MobileAppShell, { MOBILE_NAV_ID } from './mobile/MobileAppShell'
import MobileBottomNav from './mobile/MobileBottomNav'
import Sidebar, { SidebarNavigation } from './sidebar/Sidebar'
import StatusBar from './statusbar/StatusBar'
import Workspace from './workspace/Workspace'
import { sfx } from '@/lib/sfx'

export interface UserSummary {
  name?: string | null
  title?: string | null
  level?: number
  xp?: number
  xpRequired?: number
  /** Spendable scan credits. The HUD renders this as the MP bar. */
  questsRemaining?: number
  spellsCast?: number
  questsExported?: number
  /** High-water mark for credits, used as the MP bar's denominator. */
  maxCredits?: number
  /** Live signals still awaiting a claim or dismissal. */
  openQuests?: number
  profileIconKey?: string | null
}

interface CoQuestShellProps {
  user?: UserSummary
  children: ReactNode
}

export default function CoQuestShell({
  user,
  children,
}: CoQuestShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const saved = localStorage.getItem('coquest_sidebar_collapsed')
      return saved === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  const openMobile = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      if (next) {
        sfx.playSidebarCollapse()
      } else {
        sfx.playSidebarExpand()
      }
      try {
        localStorage.setItem('coquest_sidebar_collapsed', String(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }

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
  }, [])

  return (
    <ShellLayout
      collapsed={collapsed}
      sidebar={
        // Desktop rail only — the mobile drawer is owned by MobileAppShell.
        <Sidebar user={user} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      }
      statusBar={
        <StatusBar
          user={user}
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
        sidebar={<SidebarNavigation mobile onNavigate={closeMobile} />}
        bottomBar={<MobileBottomNav mobileOpen={mobileOpen} onOpenNavigation={openMobile} />}
      >
        <Workspace>{children}</Workspace>
      </MobileAppShell>
    </ShellLayout>
  )
}
