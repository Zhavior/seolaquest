'use client'

import { useEffect, useState } from 'react'

const STEPS = [
  'AUTHENTICATING ADVENTURER',
  'LOADING GUILD PROFILE',
  'RESTORING QUESTS',
  'SUMMONING SCOUTS',
  'SCANNING REALM',
  'COUNTING LOOT',
  'PREPARING HQ',
  'ENTERING REALM',
]

export default function RootLoading() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let current = 0

    const timer = setInterval(() => {
      current += Math.floor(Math.random() * 2) + 1

      if (current >= 100) {
        current = 100
        clearInterval(timer)
      }

      setProgress(current)
    }, 45)

    return () => clearInterval(timer)
  }, [])

  const filled = Math.round((progress / 100) * 8)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F0EA] p-6">
      <div className="w-full max-w-md border-4 border-black bg-[#F5F2E9] p-8 shadow-[8px_8px_0_0_#000]">

        <div className="mb-6 flex justify-center text-6xl animate-pulse">
          ⚔️
        </div>

        <h2 className="mb-5 text-center text-3xl font-black uppercase">
          Entering the Realm
        </h2>

        <div className="mb-4 border-4 border-black bg-white p-1">
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 border-2 border-black ${
                  i < filled
                    ? 'bg-[#FF5C35]'
                    : 'bg-white'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between font-mono text-sm font-black uppercase">

          <span>
            [{String(filled).padStart(2,'0')} / 08]
          </span>

          <span>{progress}%</span>

        </div>

        <p className="mt-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-black/70">
          {STEPS[Math.min(filled,7)]}...
        </p>

      </div>
    </div>
  )
}
