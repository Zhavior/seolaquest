'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Swords, X } from 'lucide-react'
import { sfx } from '@/lib/sfx'

/**
 * The reward banner shown once, immediately after first-run setup commits.
 *
 * It reports what the server already wrote — the quests are assigned inside
 * onboarding, never here — so a refresh or a shared link cannot mint anything.
 * The query params are stripped as soon as it mounts, which is also what stops
 * the banner reappearing on every later visit.
 *
 * It does not announce XP. Finishing setup no longer pays any: progression is
 * earned against the quests this banner is announcing, not against the act of
 * signing up.
 */
export default function FirstQuestBanner() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const questComplete = params.get('questComplete') === 'first-quest'
  const questCount = Number.parseInt(params.get('quests') ?? '', 10)
  const sampleCount = Number.parseInt(params.get('samples') ?? '', 10)

  const [visible, setVisible] = useState(questComplete)

  useEffect(() => {
    if (!questComplete) return

    sfx.playLevelUp()

    // Consume the params right away. Keeping them in the URL would replay the
    // celebration on every back-navigation to this page.
    const next = new URLSearchParams(params.toString())
    for (const key of ['questComplete', 'quests', 'samples']) next.delete(key)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })

    const timer = setTimeout(() => setVisible(false), 12_000)
    return () => clearTimeout(timer)
    // Runs once for the arrival that carried the params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questComplete])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-3"
    >
      <div className="pointer-events-auto w-full max-w-xl border-4 border-outline bg-success p-4 shadow-brutal-lg">
        <div className="flex items-start gap-3">
          <Sparkles aria-hidden className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={3} />

          <div className="min-w-0 flex-1">
            <p className="text-lg font-black uppercase leading-tight">
              Quest complete — first hunt armed
            </p>

            <p className="mt-2 text-sm font-bold text-ink/80">
              {Number.isFinite(questCount) && questCount > 0
                ? `${questCount} quests are on your board. `
                : ''}
              Your keyword is tracked and your schedule is on.
            </p>

            {Number.isFinite(sampleCount) && sampleCount > 0 ? (
              <p className="mt-2 flex items-start gap-2 border-3 border-outline bg-card p-2 text-xs font-black uppercase">
                <Swords aria-hidden className="mt-px h-4 w-4 shrink-0" strokeWidth={3} />
                <span>
                  {sampleCount} tutorial signals loaded so you can practise claiming and
                  dismissing. They are samples, not real people.
                </span>
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss"
            className="shrink-0 border-3 border-outline bg-card p-1 shadow-brutal-sm"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )
}
