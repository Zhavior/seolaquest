'use client'

import { useState, useEffect, type ReactNode } from 'react'

import CommandPalette from '../os/palette/CommandPalette'
import ShellLayout from './layout/ShellLayout'
import Sidebar from './sidebar/Sidebar'
import StatusBar from './statusbar/StatusBar'
import Workspace from './workspace/Workspace'

export interface UserSummary {
  name?: string | null
  title?: string | null
  level?: number
  xp?: number
  xpRequired?: number
  questsRemaining?: number
  spellsCast?: number
  questsExported?: number
  maxCredits?: number
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

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
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
        <Sidebar
          user={user}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={toggleCollapsed}
        />
      }
      statusBar={
        <StatusBar
          user={user}
          collapsed={collapsed}
          onOpenNavigation={() => setMobileOpen(true)}
          onToggleCollapsed={toggleCollapsed}
        />
      }
    >
      <CommandPalette />
      <Workspace>{children}</Workspace>
    </ShellLayout>
  )
}
