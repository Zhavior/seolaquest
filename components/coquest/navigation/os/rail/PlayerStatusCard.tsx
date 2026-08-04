'use client'

import { getLevelInfo } from '../shared/progression'
import { quests } from '../shared/quests'

interface PlayerStatusCardProps {
  collapsed: boolean
  name: string
  xp: number
  title: string
  quest: string
}

export function PlayerStatusCard({
  collapsed,
  name,
  xp,
  title,
  quest,
}: PlayerStatusCardProps) {
  const info = getLevelInfo(xp)

  const activeQuest =
    quests.find((q) => q.id === quest) ?? quests[0]

  if (collapsed) {
    return (
      <div className="border-2 border-black bg-[#FFE066] p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl">⚔</div>
          <div className="text-[10px] font-black">LV {info.level}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-black bg-[#FFF1A8] p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em]">
          Player
        </p>

        <h2 className="mt-1 text-lg font-black uppercase">
          {name}
        </h2>

        <p className="text-xs font-bold uppercase opacity-70">
          {title}
        </p>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-[10px] font-black uppercase">
          <span>Level {info.level}</span>
          <span>{activeQuest.progress}%</span>
        </div>

        <div className="h-3 border-2 border-black bg-white">
          <div
            className="h-full bg-[#FFD54F] transition-all duration-300"
            style={{ width: `${activeQuest.progress}%` }}
          />
        </div>
      </div>

      <div className="border-2 border-black bg-white p-3">
        <p className="text-[10px] font-black uppercase">
          Main Quest
        </p>

        <p className="mt-2 text-sm font-black leading-tight">
          {activeQuest.title}
        </p>
      </div>
    </div>
  )
}
