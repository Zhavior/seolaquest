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
  Sparkles,
  Scroll,
} from 'lucide-react'
import { type UserSummary } from '../CoQuestShell'
import { player } from '../../os/shared/player'
import { getLevelInfo } from '../../os/shared/progression'
import { sfx } from '@/lib/sfx'

interface StatusBarProps {
  user?: UserSummary
  collapsed?: boolean
  onOpenNavigation: () => void
  onToggleCollapsed?: () => void
}

/**
 * Authenticated shell header with Sun/Moon Grey Mode toggle, EXP bar, MP bar, and Quests indicator.
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
      document.body?.classList.add('grey-mode')
    }
  }, [])

  const toggleThemeMode = () => {
    const nextMode = !isGreyMode
    setIsGreyMode(nextMode)
    if (nextMode) {
      document.documentElement.classList.add('grey-mode')
      document.body?.classList.add('grey-mode')
      localStorage.setItem('coquest_theme', 'grey')
    } else {
      document.documentElement.classList.remove('grey-mode')
      document.body?.classList.remove('grey-mode')
      localStorage.setItem('coquest_theme', 'parchment')
    }
  }

  const userName = user?.name || player.name || 'REINALD'
  const playerXp = user?.xp ?? player.xp
  const levelInfo = getLevelInfo(playerXp)
  const xpPercent = levelInfo.progress
  const activeXpSegments = Math.round((xpPercent / 100) * 8)

  const currentMp = 70
  const maxMp = 100
  const activeManaSegments = Math.round((currentMp / maxMp) * 8)
  const remainingQuests = user?.questsRemaining ?? 12

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
            className="grid size-10 shrink-0 place-items-center border-[3px] border-black bg-[#FFD84D] shadow-[2.5px_2.5px_0_0_#000] transition-transform duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:hidden"
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

        {/* Center/Right HUD Telemetry Cluster: EXP Bar + MP Bar + Quests (Responsive) */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          
          {/* MOBILE COMPACT TELEMETRY BADGES (< md) */}
          <div className="flex items-center gap-1 md:hidden">
            {/* Mobile Quests Count */}
            <Link
              href="/app/runs"
              title={`${remainingQuests} Active Quests`}
              className="flex items-center gap-1 border-2 border-black bg-[#FF5722] text-white px-2 py-1 text-[10px] font-black uppercase shadow-[1.5px_1.5px_0_0_#000]"
            >
              <Scroll className="size-3" strokeWidth={3} />
              <span>{remainingQuests}</span>
            </Link>

            {/* Mobile MP */}
            <div className="flex items-center gap-1 border-2 border-black bg-[#06B6D4] text-white px-2 py-1 text-[10px] font-black uppercase shadow-[1.5px_1.5px_0_0_#000]">
              <Zap className="size-3 text-[#FFE600] animate-pulse" strokeWidth={3} />
              <span>{currentMp}</span>
            </div>

            {/* Mobile Level & EXP */}
            <div className="flex items-center gap-1 border-2 border-black bg-[#FFE600] text-black px-2 py-1 text-[10px] font-black uppercase shadow-[1.5px_1.5px_0_0_#000]">
              <Sparkles className="size-3 text-black" strokeWidth={3} />
              <span>L{levelInfo.level}</span>
            </div>
          </div>

          {/* DESKTOP EXP & MP METERS (md+) */}
          <div className="hidden items-center gap-3 md:flex">
            
            {/* Active Quests Pill */}
            <Link
              href="/app/runs"
              title="View Active Quests"
              className="flex items-center gap-1.5 border-[3px] border-black bg-[#FF5722] text-white px-3 py-1.5 shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-transform"
            >
              <Scroll className="size-3.5 shrink-0" strokeWidth={3} />
              <span className="font-mono text-[11px] font-black uppercase tracking-wider">
                {remainingQuests} QUESTS
              </span>
            </Link>

            {/* EXP / Level Progress Bar */}
            <div className="flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#000]">
              <div className="flex items-center gap-1">
                <Sparkles className="size-3.5 text-[#F59E0B]" strokeWidth={3} />
                <span className="border-2 border-black bg-[#FFE600] px-1.5 py-0.2 font-mono text-[9px] font-black uppercase text-black">
                  LVL {levelInfo.level}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block h-3 w-1.5 border border-black ${
                      i < activeXpSegments ? 'bg-[#FFE600]' : 'bg-zinc-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
                XP {playerXp.toLocaleString()}
              </span>
            </div>

            {/* MP / Mana Vault Meter */}
            <div className="flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#000]">
              <Zap aria-hidden="true" className="size-3.5 shrink-0 text-[#06B6D4] animate-pulse" strokeWidth={3} />
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block h-3 w-1.5 border border-black ${
                      i < activeManaSegments ? 'bg-[#06B6D4]' : 'bg-zinc-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
                {currentMp}/{maxMp} MP
              </span>
            </div>

            {/* User Name Badge */}
            <div className="hidden lg:flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#000]">
              <div className="grid size-6 shrink-0 place-items-center border-2 border-black bg-[#FFD84D]">
                <User aria-hidden="true" className="size-3.5 text-black" strokeWidth={3} />
              </div>
              <span className="max-w-[8rem] truncate font-mono text-[11px] font-black uppercase tracking-wider text-black">
                {userName}
              </span>
            </div>
          </div>

          {/* Sun / Moon Theme Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleThemeMode}
            aria-label={isGreyMode ? 'Switch to Parchment Light Mode' : 'Switch to Slate Grey Dark Mode'}
            title={isGreyMode ? 'Parchment Light Mode' : 'Slate Grey Dark Mode'}
            className="size-8 sm:size-9 grid place-items-center border-[3px] border-black bg-white shadow-[2.5px_2.5px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0"
          >
            {isGreyMode ? (
              <Sun className="size-4 text-amber-500 fill-amber-400" strokeWidth={3} />
            ) : (
              <Moon className="size-4 text-black fill-black/20" strokeWidth={3} />
            )}
          </button>

          {/* SFX Sound Toggle */}
          <button
            type="button"
            onClick={() => setSfxEnabled((v) => !v)}
            aria-label={sfxEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            className="hidden size-9 place-items-center border-[3px] border-black bg-white shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none xl:grid shrink-0"
          >
            {sfxEnabled ? (
              <Volume2 className="size-4 text-black" strokeWidth={3} />
            ) : (
              <VolumeX className="size-4 text-black" strokeWidth={3} />
            )}
          </button>

          {/* Recharge Action CTA */}
          <Link
            href="/app/billing"
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
