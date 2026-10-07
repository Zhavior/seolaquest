'use client'

import React, { type ReactNode } from 'react'
import Link from 'next/link'
import {
  Menu,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { Icon } from '@/features/handbook/artifact/IconSprite'
import { sfx } from '@/lib/sfx'
import { SoundControls } from './SoundControls'


interface StatusBarProps {
  /**
   * Server-rendered telemetry cluster (`ShellHud`). Passed in as a slot so the
   * account record never has to cross this client boundary.
   */
  hud?: ReactNode
  collapsed?: boolean
  onOpenNavigation: () => void
  onToggleCollapsed?: () => void
}

/**
 * Authenticated shell header: navigation controls, the HUD slot, and the
 * colour-mode / sound toggles.
 */
export default function StatusBar({
  hud,
  collapsed = false,
  onOpenNavigation,
  onToggleCollapsed,
}: StatusBarProps) {
  return (
    <header
      aria-label="SEOlaQuest navigation"
      className="dq-topbar sticky inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] select-none"
    >
      <div className="relative z-10 mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:h-16 sm:gap-3 sm:px-6">

        {/* Left: Menu & Brand Logo */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenNavigation}
            aria-label="Open navigation"
            className="grid size-10 shrink-0 place-items-center border border-outline text-[#f3d58a] transition-colors hover:border-[#d8a93b] md:hidden"
          >
            <Menu className="size-4" strokeWidth={1.75} />
          </button>

          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              onMouseEnter={() => sfx.playSidebarHover()}
              onFocus={() => sfx.playSidebarHover()}
              title={collapsed ? 'Expand Sidebar (Cmd+B)' : 'Collapse Sidebar (Cmd+B)'}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              className="hidden size-9 shrink-0 place-items-center border border-outline text-[#d9d0ec] transition-colors hover:border-[#d8a93b] hover:text-[#f3d58a] md:grid"
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="size-4" strokeWidth={1.75} />
              )}
            </button>
          )}

          <Link href="/app" aria-label="SEOlaQuest home" className="flex min-h-11 min-w-0 shrink-0 items-center gap-2.5">
            <Icon name="crest" size={34} className="shrink-0" />
            <span className="dq-brand-word hidden text-lg leading-none min-[400px]:inline sm:text-[1.4rem]">
              SEOlaQuest
            </span>
          </Link>
        </div>

        {/* Center/Right cluster: server-rendered HUD, then the client toggles */}
        <div className="flex shrink-0 items-center gap-1.5">
          {hud}

          {/* Thin divider */}
          <div aria-hidden="true" className="mx-0.5 hidden h-6 w-px bg-outline sm:block" />

          <SoundControls />

          {/* Recharge CTA */}
          <Link
            href="/app/billing?offer=founder"
            className="dq-plate shrink-0 px-3 sm:px-4"
          >
            <Zap aria-hidden="true" className="size-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">Add credits</span>
            <span className="sm:hidden text-[10px] font-semibold">+</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
