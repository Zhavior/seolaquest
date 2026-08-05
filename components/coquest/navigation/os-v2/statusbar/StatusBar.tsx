'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Menu,
  Sword,
  User,
  Zap,
  Volume2,
  VolumeX,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from 'lucide-react'
import { type UserSummary } from '../CoQuestShell'
import { player } from '../../os/shared/player'
import { getLevelInfo } from '../../os/shared/progression'

interface StatusBarProps {
  user?: UserSummary
  collapsed?: boolean
  onOpenNavigation: () => void
  onToggleCollapsed?: () => void
}

/**
 * Authenticated shell header with Sun/Moon Grey Mode toggle.
 */
export default function StatusBar({
  user,
  collapsed = false,
  onOpenNavigation,
  onToggleCollapsed,
}: StatusBarProps) {
  const [sfxEnabled, setSfxEnabled] = useState(true)
  const [isGreyMode, setIsGreyMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('coquest_theme')
    if (savedTheme === 'grey') {
      setIsGreyMode(true)
      document.documentElement.classList.add('grey-mode')
    }
  }, [])

  const toggleThemeMode = () => {
    const nextMode = !isGreyMode
    setIsGreyMode(nextMode)
    if (nextMode) {
      document.documentElement.classList.add('grey-mode')
      localStorage.setItem('coquest_theme', 'grey')
    } else {
      document.documentElement.classList.remove('grey-mode')
      localStorage.setItem('coquest_theme', 'parchment')
    }
  }

  const userName = user?.name || player.name || 'REINALD'
  const playerXp = user?.xp ?? player.xp
  const level = getLevelInfo(playerXp)
  const currentMp = 70
  const maxMp = 100
  const activeManaSegments = Math.round((currentMp / maxMp) * 10)

  return (
    <header
      aria-label="SEO la Quest navigation"
      className="sticky inset-x-0 top-0 z-50 border-b-4 border-black bg-[#f4ebd8]/95 pt-[env(safe-area-inset-top)] backdrop-blur-md"
    >
      <div className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:h-20 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenNavigation}
            aria-label="Open navigation"
            className="grid size-11 shrink-0 place-items-center border-[3px] border-black bg-[#FFD84D] shadow-[3px_3px_0_0_#000] transition-transform duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:hidden"
          >
            <Menu className="size-5 text-black" strokeWidth={3} />
          </button>

          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
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

          <Link href="/app" className="flex min-w-0 shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 -rotate-6 items-center justify-center border-[3px] border-black bg-[#FFD84D] shadow-[3px_3px_0_0_#000] sm:h-11 sm:w-11 sm:border-4">
              <Sword aria-hidden="true" size={18} strokeWidth={3} className="text-black sm:h-5 sm:w-5" />
            </div>

            <div className="hidden min-[400px]:flex flex-col">
              <span className="text-xl font-black uppercase leading-none tracking-[0.18em] text-black sm:text-3xl">
                SEO LA QUEST
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-600 sm:text-[10px]">
                {'// REALM v1.0'}
              </span>
            </div>
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#000]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00c951] motion-safe:animate-pulse motion-reduce:animate-none" />
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-black">
              RADAR ONLINE
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Sun / Moon Theme Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleThemeMode}
            aria-label={isGreyMode ? 'Switch to Parchment Light Mode' : 'Switch to Slate Grey Dark Mode'}
            title={isGreyMode ? 'Parchment Light Mode' : 'Slate Grey Dark Mode'}
            className="size-9 grid place-items-center border-[3px] border-black bg-white shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {isGreyMode ? (
              <Sun className="size-4.5 text-amber-500 fill-amber-400" strokeWidth={3} />
            ) : (
              <Moon className="size-4.5 text-black fill-black/20" strokeWidth={3} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSfxEnabled((v) => !v)}
            aria-label={sfxEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            className="hidden size-9 place-items-center border-[3px] border-black bg-white shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none xl:grid"
          >
            {sfxEnabled ? (
              <Volume2 className="size-4 text-black" strokeWidth={3} />
            ) : (
              <VolumeX className="size-4 text-black" strokeWidth={3} />
            )}
          </button>

          <div className="hidden items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#000] lg:flex">
            <Zap aria-hidden="true" className="size-3.5 shrink-0 text-black" strokeWidth={3} />
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`inline-block h-3 w-1.5 border border-black ${
                    i < activeManaSegments ? 'bg-[#FFD84D]' : 'bg-zinc-200'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-black">
              {currentMp}/{maxMp} MP
            </span>
          </div>

          <div className="hidden items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#000] sm:flex">
            <div className="grid size-6 shrink-0 place-items-center border-2 border-black bg-[#FFD84D]">
              <User aria-hidden="true" className="size-3.5 text-black" strokeWidth={3} />
            </div>
            <span className="max-w-[9rem] truncate font-mono text-[11px] font-black uppercase tracking-[0.18em] text-black">
              {userName}
            </span>
            <span className="border-2 border-black bg-[#FFD84D] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-black">
              LVL {level.level}
            </span>
          </div>

          <Link
            href="/app/billing"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 border-[3px] border-black bg-[#ff5a36] px-3 py-2 font-black uppercase tracking-[0.14em] text-black shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-4 sm:text-sm"
          >
            <Zap aria-hidden="true" className="size-4 text-black" strokeWidth={3} />
            <span className="hidden sm:inline">Recharge</span>
            <span className="sr-only sm:hidden">Recharge</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
