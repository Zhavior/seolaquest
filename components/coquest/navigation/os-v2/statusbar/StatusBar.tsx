'use client'

import React, { type ReactNode } from 'react'
import Link from 'next/link'
import {
  Menu,
  Sword,
  Zap,
  Volume2,
  VolumeX,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from 'lucide-react'
import { sfx } from '@/lib/sfx'

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
  /**
   * Both toggles below keep their state on the DOM rather than in React.
   *
   * The server cannot read localStorage, so any React state seeded from it
   * disagrees with the server-rendered HTML on the very first client render.
   * Instead the blocking script in the root layout applies the saved
   * preferences as classes on `<html>` before first paint, and CSS picks the
   * matching icon — correct immediately, with nothing to reconcile.
   */
  const toggleSfx = () => {
    // `sfx.toggle()` is what actually mutes the engine and persists the choice.
    // This used to flip a local boolean only, so the button swapped its own icon
    // and the sound kept playing.
    const enabled = sfx.toggle()
    document.documentElement.classList.toggle('sfx-muted', !enabled)
  }

  /**
   * Colour mode lives on the DOM, not in React state. The blocking script in
   * the root layout applies `grey-mode` before first paint, and CSS decides
   * which icon shows — so there is no stored value for React to read back and
   * no mismatch between the server's HTML and the first client render.
   */
  const toggleThemeMode = () => {
    const next = !document.documentElement.classList.contains('grey-mode')
    document.documentElement.classList.toggle('grey-mode', next)
    document.body?.classList.toggle('grey-mode', next)
    try {
      localStorage.setItem('coquest_theme', next ? 'grey' : 'parchment')
    } catch {
      // Ignore storage errors — the class is already applied either way.
    }
  }

  return (
    <header
      aria-label="SEO la Quest navigation"
      className="sticky inset-x-0 top-0 z-50 border-b-4 border-black bg-[#f4ebd8]/95 pt-[env(safe-area-inset-top)] backdrop-blur-md select-none"
    >
      <div className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:h-20 sm:gap-4 sm:px-6">

        {/* Left: Menu & Brand Logo */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenNavigation}
            aria-label="Open navigation"
            className="grid min-h-[44px] min-w-[44px] size-11 shrink-0 place-items-center border-[3px] border-black bg-[#FFD84D] shadow-[2.5px_2.5px_0_0_#000] transition-transform duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:hidden"
          >
            <Menu className="size-5 text-black" strokeWidth={3} />
          </button>

          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              onMouseEnter={() => sfx.playSidebarHover()}
              onFocus={() => sfx.playSidebarHover()}
              title={collapsed ? 'Expand Sidebar (Cmd+B)' : 'Collapse Sidebar (Cmd+B)'}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              className="hidden size-9 shrink-0 place-items-center border-[3px] border-black bg-[#FFD84D] shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:grid"
            >
              {collapsed ? (
                <PanelLeftOpen className="size-5 text-black" strokeWidth={3} />
              ) : (
                <PanelLeftClose className="size-5 text-black" strokeWidth={3} />
              )}
            </button>
          )}

          <Link href="/app" className="flex min-w-0 shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 -rotate-6 items-center justify-center border-[3px] border-black bg-[#FFD84D] shadow-[2.5px_2.5px_0_0_#000] sm:h-11 sm:w-11 sm:border-4">
              <Sword aria-hidden="true" size={18} strokeWidth={3} className="text-black sm:h-5 sm:w-5" />
            </div>

            <div className="hidden min-[400px]:flex flex-col">
              <span className="text-lg font-black uppercase leading-none tracking-[0.16em] text-black sm:text-2xl">
                SEO LA QUEST
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600 sm:text-[10px]">
                {'// REALM v1.0'}
              </span>
            </div>
          </Link>
        </div>

        {/* Center/Right cluster: server-rendered HUD, then the client toggles */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {hud}

          {/* Sun / Moon Theme Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleThemeMode}
            aria-label="Toggle colour mode"
            title="Toggle colour mode"
            className="size-8 sm:size-9 grid place-items-center border-[3px] border-black bg-white shadow-[2.5px_2.5px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0"
          >
            <Sun aria-hidden="true" className="theme-icon-sun size-4 text-amber-500 fill-amber-400" strokeWidth={3} />
            <Moon aria-hidden="true" className="theme-icon-moon size-4 text-black fill-black/20" strokeWidth={3} />
          </button>

          {/* SFX Sound Toggle */}
          <button
            type="button"
            onClick={toggleSfx}
            aria-label="Toggle sound effects"
            title="Toggle sound effects"
            className="hidden size-9 place-items-center border-[3px] border-black bg-white shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none xl:grid shrink-0"
          >
            <Volume2 aria-hidden="true" className="sfx-icon-on size-4 text-black" strokeWidth={3} />
            <VolumeX aria-hidden="true" className="sfx-icon-off size-4 text-black" strokeWidth={3} />
          </button>

          {/* Recharge Action CTA — lands on the Founder offer, not the top of the page */}
          <Link
            href="/app/billing?offer=founder"
            className="inline-flex h-9 sm:min-h-11 shrink-0 items-center gap-1 border-[3px] border-black bg-[#ff5a36] px-2.5 sm:px-4 py-1 font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs sm:text-sm"
          >
            <Zap aria-hidden="true" className="size-3.5 sm:size-4 text-black" strokeWidth={3} />
            <span className="hidden sm:inline">Recharge</span>
            <span className="sm:hidden text-[10px] font-black">+</span>
          </Link>

        </div>
      </div>
    </header>
  )
}
