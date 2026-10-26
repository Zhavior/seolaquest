'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameMode } from '@/components/seolaquest/GameModeContext'
import { gameModeCookie } from '@/lib/gameMode'

/**
 * The one switch for the optional game layer: XP, levels, Goals and the
 * Activity stat cards. Off by default. Saved in this browser as a cookie, so
 * the server renders the menu and header to match on the next request.
 */
export function GameModeSetting() {
  const router = useRouter()
  const saved = useGameMode()
  const [on, setOn] = useState(saved)

  function change(next: boolean) {
    setOn(next)
    document.cookie = gameModeCookie(next)
    router.refresh()
  }

  return (
    <section aria-labelledby="game-mode-heading" className="rounded-[20px] border border-outline bg-card p-5 shadow-sm sm:p-6">
      <h2 id="game-mode-heading" className="font-display text-2xl font-semibold normal-case text-ink">
        XP, levels and goals
      </h2>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-muted">
        Turn this on to earn XP, go up levels and see small goals as you work. It is off unless you turn it on, and
        nothing else in SEOlaQuest changes either way.
      </p>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-base font-semibold text-ink">
        <input
          type="checkbox"
          checked={on}
          onChange={(event) => change(event.target.checked)}
          className="size-6 accent-[#d8a93b]"
        />
        Show XP, levels and goals
      </label>
      <p className="mt-2 text-sm text-ink-muted">Saved in this browser.</p>
    </section>
  )
}
