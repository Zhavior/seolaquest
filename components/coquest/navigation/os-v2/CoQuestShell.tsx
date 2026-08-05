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
        header={
          <div className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={openMobile}
              aria-label="Open navigation"
              aria-controls={MOBILE_NAV_ID}
              aria-expanded={mobileOpen}
              className="grid size-9 shrink-0 place-items-center border-3 border-black bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Menu className="size-5 text-black" strokeWidth={3} />
            </button>
            {/* Short brand mark — this bar is inside the `md:hidden` mobile header,
                so the desktop sidebar's full "SEO la Quest" never competes with it. */}
            <span className="text-xs font-black uppercase tracking-[0.2em]">SEOLQ</span>
          </div>
        }
        bottomBar={<MobileBottomNav mobileOpen={mobileOpen} onOpenNavigation={openMobile} />}
      >
        <Workspace>{children}</Workspace>
      </MobileAppShell>
    </ShellLayout>
  )
}
