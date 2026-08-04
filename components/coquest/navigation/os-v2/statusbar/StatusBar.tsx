'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, User, Zap, Volume2, VolumeX, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { type UserSummary } from '../CoQuestShell'
import { player } from '../../os/shared/player'
import { getLevelInfo } from '../../os/shared/progression'

interface StatusBarProps {
  user?: UserSummary
  collapsed?: boolean
  onOpenNavigation: () => void
  onToggleCollapsed?: () => void
}

export default function StatusBar({
  user,
  collapsed = false,
  onOpenNavigation,
  onToggleCollapsed,
}: StatusBarProps) {
  const [sfxEnabled, setSfxEnabled] = useState(true)
  const userName = user?.name || player.name || 'REINALD'
  const playerXp = user?.xp ?? player.xp
  const level = getLevelInfo(playerXp)
  const currentMp = 70
  const maxMp = 100

  return (
    <header className="w-full border-b-4 border-black bg-white px-4 py-2.5 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-50 flex items-center justify-between relative">
      {/* Mobile Menu Button + Left: Brand & Adventurer Identity */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Open navigation"
          className="grid size-9 shrink-0 place-items-center border-3 border-black bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none md:hidden"
        >
          <Menu className="size-5 text-black" strokeWidth={3} />
        </button>

        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? 'Expand Sidebar (Cmd+B)' : 'Collapse Sidebar (Cmd+B)'}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="hidden md:grid size-9 shrink-0 place-items-center border-3 border-black bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 text-black" strokeWidth={3} />
            ) : (
              <PanelLeftClose className="size-5 text-black" strokeWidth={3} />
            )}
          </button>
        )}

        <Link
          href="/app"
          className="font-black text-xl md:text-2xl tracking-[0.16em] uppercase border-3 border-black bg-[#FFE600] px-3.5 py-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD600] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center gap-1.5"
        >
          <span>COQUEST</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2.5 border-3 border-black bg-white px-3 py-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid size-6 place-items-center border-2 border-black bg-[#FFE600]">
            <User className="size-3.5 shrink-0 text-black" strokeWidth={3} />
          </div>
          <span className="font-black text-xs uppercase tracking-wider text-black">{userName}</span>
          <span className="bg-black text-[#FFE600] text-[10px] font-black px-2 py-0.5 tracking-widest uppercase border border-black -rotate-1">
            LVL {level.level}
          </span>
        </div>
      </div>

      {/* Center: Mana Vault Indicators */}
      <div className="flex items-center gap-3.5 border-3 border-black bg-black text-white px-4 py-1.5 shadow-[4px_4px_0px_0px_#06B6D4]">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-[#06B6D4] animate-pulse" strokeWidth={3} />
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 hidden md:inline">
            Mana Vault:
          </span>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 10 }).map((_, i) => {
            const activeCount = Math.round((currentMp / maxMp) * 10)
            const isActive = i < activeCount
            return (
              <span
                key={i}
                className={`inline-block h-4 w-2.5 border border-white transition-all ${
                  isActive
                    ? 'bg-gradient-to-t from-cyan-500 to-[#A3E635] shadow-[0_0_8px_#06B6D4]'
                    : 'bg-slate-800 opacity-40'
                }`}
              />
            )
          })}
        </div>

        <span className="font-mono text-xs font-black border-l-2 border-dashed border-[#06B6D4] pl-3 text-[#FFE600] tracking-wider">
          {currentMp}/{maxMp} MP
        </span>
        <span className="hidden lg:inline-block bg-[#FFE600] text-black border border-black px-2 py-0.5 text-[9px] font-black tracking-widest uppercase -rotate-1">
          LEGEND
        </span>
      </div>

      {/* Right: Quick Recharge Action & SFX Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSfxEnabled((v) => !v)}
          className="hidden xl:flex items-center gap-1.5 bg-black text-[#FFE600] border-2 border-white px-2.5 py-1 text-[10px] uppercase font-black shadow-[2px_2px_0_0_#fff] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#fff] active:translate-y-0.5 active:shadow-none transition-all"
        >
          {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          SFX {sfxEnabled ? 'ON' : 'OFF'}
        </button>

        <div className="hidden lg:flex items-center gap-2 border-2 border-black bg-[#A3E635] px-3 py-1 text-xs font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-1">
          <span className="h-2.5 w-2.5 rounded-full bg-black animate-pulse" />
          <span>RADAR ACTIVE</span>
        </div>

        <Link
          href="/app/billing"
          className="border-3 border-black bg-[#06B6D4] text-white px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center gap-1.5"
        >
          <Zap className="size-4 text-[#FFE600]" strokeWidth={3} />
          <span>+ RECHARGE</span>
        </Link>
      </div>
    </header>
  )
}
